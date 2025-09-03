
  -- 1) Create base_locations table
CREATE TABLE IF NOT EXISTS public.base_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'delivery' or 'lab_collection' (we will use 'delivery')
  base_lat DOUBLE PRECISION NOT NULL,
  base_lng DOUBLE PRECISION NOT NULL,
  base_fare NUMERIC NOT NULL DEFAULT 0,
  base_km NUMERIC NOT NULL DEFAULT 0,
  per_km_fee NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS trg_base_locations_updated_at ON public.base_locations;
CREATE TRIGGER trg_base_locations_updated_at
BEFORE UPDATE ON public.base_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow only one default per service_type (e.g., one default for 'delivery')
DROP INDEX IF EXISTS base_locations_one_default_per_service;
CREATE UNIQUE INDEX base_locations_one_default_per_service
ON public.base_locations (service_type)
WHERE is_default = true;

-- Enable RLS and admin-only management
ALTER TABLE public.base_locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_locations' AND policyname = 'Admins can manage base locations'
  ) THEN
    CREATE POLICY "Admins can manage base locations"
      ON public.base_locations
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END$$;

-- 2) RPC: delivery-only fee calculation from base/default location
CREATE OR REPLACE FUNCTION public.calc_distance_fee_from_geofence(
  p_service TEXT,
  p_dest_lat DOUBLE PRECISION,
  p_dest_lng DOUBLE PRECISION
)
RETURNS TABLE (
  distance_km NUMERIC,
  fee NUMERIC,
  base_location_id UUID,
  base_location_name TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service TEXT := lower(p_service);
  v_row public.base_locations%ROWTYPE;
  v_distance_m NUMERIC;
  v_distance_km NUMERIC;
  v_fee NUMERIC;
BEGIN
  -- We never calculate lab collection fees
  IF v_service <> 'delivery' THEN
    RETURN;
  END IF;

  -- Choose active default (fallback to highest priority) base location for delivery
  SELECT *
  INTO v_row
  FROM public.base_locations bl
  WHERE bl.service_type = 'delivery' AND bl.is_active = true
  ORDER BY bl.is_default DESC, bl.priority DESC, bl.created_at DESC
  LIMIT 1;

  -- No base location set yet: return no rows (frontend treats as "no preview")
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Geodesic distance in meters using geography
  v_distance_m := ST_Distance(
    ST_SetSRID(ST_MakePoint(v_row.base_lng, v_row.base_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography
  );

  v_distance_km := COALESCE(v_distance_m, 0) / 1000.0;

  -- Fee = base_fare + max(distance_km - base_km, 0) * per_km_fee
  v_fee := COALESCE(v_row.base_fare, 0)
         + GREATEST(v_distance_km - COALESCE(v_row.base_km, 0), 0) * COALESCE(v_row.per_km_fee, 0);

  RETURN QUERY
  SELECT v_distance_km::NUMERIC,
         v_fee::NUMERIC,
         v_row.id,
         v_row.name;
END;
$$;

-- (Optional) Make sure the function is callable by clients
GRANT EXECUTE ON FUNCTION public.calc_distance_fee_from_geofence(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;
  