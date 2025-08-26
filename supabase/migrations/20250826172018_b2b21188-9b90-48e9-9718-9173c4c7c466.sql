
-- 1) Table to store delivery base locations
CREATE TABLE public.delivery_base_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text NOT NULL DEFAULT 'delivery',
  geofence_id uuid REFERENCES public.geofences(id) ON DELETE SET NULL,
  base_lat double precision NOT NULL,
  base_lng double precision NOT NULL,
  base_fare numeric NOT NULL DEFAULT 0,
  per_km_fee numeric NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_delivery_base_locations_geofence_id ON public.delivery_base_locations(geofence_id);
CREATE INDEX IF NOT EXISTS idx_delivery_base_locations_active ON public.delivery_base_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_base_locations_priority ON public.delivery_base_locations(priority);

-- 2) Simple trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_delivery_base_locations_updated_at
BEFORE UPDATE ON public.delivery_base_locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 3) RLS: admins manage; others cannot access directly
ALTER TABLE public.delivery_base_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage base locations"
  ON public.delivery_base_locations
  AS PERMISSIVE
  FOR ALL
  USING (public.has_admin_access())
  WITH CHECK (public.has_admin_access());

-- 4) Fee calculation RPC based on base locations
--    Logic:
--    - Find geofence containing destination (highest priority)
--    - Prefer base location tied to that geofence (highest priority)
--    - Else, pick nearest active base location globally
--    - Fee = base_fare + per_km_fee * distance_km
CREATE OR REPLACE FUNCTION public.calc_delivery_fee_from_base(
  p_service text,
  p_dest_lat double precision,
  p_dest_lng double precision
)
RETURNS TABLE(
  distance_km numeric,
  fee numeric,
  base_id uuid,
  base_name text,
  geofence_id uuid,
  geofence_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_g RECORD;
  v_b RECORD;
  v_dist_m double precision;
  v_fee numeric;
  v_service text := public.normalize_service(p_service);
BEGIN
  -- Attempt to find a matching geofence for the destination.
  SELECT g.id, g.name
    INTO v_g
  FROM public.geofences g
  WHERE g.service_type = v_service
    AND g.is_active = true
    AND g.geom IS NOT NULL
    AND ST_Contains(
          g.geom,
          ST_SetSRID(ST_Point(p_dest_lng, p_dest_lat), 4326)
        )
  ORDER BY g.priority DESC, g.created_at ASC
  LIMIT 1;

  -- Prefer base location tied to that geofence
  IF FOUND THEN
    SELECT bl.*
      INTO v_b
    FROM public.delivery_base_locations bl
    WHERE bl.is_active = true
      AND bl.service_type = v_service
      AND bl.geofence_id = v_g.id
    ORDER BY bl.priority DESC, bl.created_at ASC
    LIMIT 1;
  END IF;

  -- If none found, pick nearest active base location globally
  IF v_b IS NULL THEN
    SELECT bl.*
      INTO v_b
    FROM public.delivery_base_locations bl
    WHERE bl.is_active = true
      AND bl.service_type = v_service
    ORDER BY ST_Distance(
      ST_SetSRID(ST_Point(bl.base_lng, bl.base_lat), 4326)::geography,
      ST_SetSRID(ST_Point(p_dest_lng, p_dest_lat), 4326)::geography
    )
    LIMIT 1;
  END IF;

  -- If still none found, return nothing (no base defined)
  IF v_b IS NULL THEN
    RETURN;
  END IF;

  -- Compute distance in meters using geography (spheroid-aware)
  v_dist_m := ST_Distance(
    ST_SetSRID(ST_Point(v_b.base_lng, v_b.base_lat), 4326)::geography,
    ST_SetSRID(ST_Point(p_dest_lng, p_dest_lat), 4326)::geography
  );

  -- Fee: base + per-km * distance_km (rounded to 2 decimals)
  v_fee := round((v_b.base_fare + (v_dist_m / 1000.0) * v_b.per_km_fee)::numeric, 2);

  RETURN QUERY
    SELECT
      (v_dist_m / 1000.0)::numeric AS distance_km,
      v_fee AS fee,
      v_b.id AS base_id,
      v_b.name AS base_name,
      COALESCE(v_g.id, NULL)::uuid AS geofence_id,
      COALESCE(v_g.name, NULL)::text AS geofence_name;
END;
$$;
