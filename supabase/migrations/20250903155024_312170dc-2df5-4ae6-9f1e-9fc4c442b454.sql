-- Create base_locations table and policies if missing, plus fee calc function and CRUD RPCs used by the app
-- 1) Table
CREATE TABLE IF NOT EXISTS public.base_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('delivery','lab_collection')),
  base_lat DOUBLE PRECISION NOT NULL,
  base_lng DOUBLE PRECISION NOT NULL,
  base_fare NUMERIC NOT NULL DEFAULT 0,
  base_km NUMERIC NOT NULL DEFAULT 0,
  per_km_fee NUMERIC NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS trg_base_locations_updated_at ON public.base_locations;
CREATE TRIGGER trg_base_locations_updated_at
BEFORE UPDATE ON public.base_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- One default per service_type
DROP INDEX IF EXISTS base_locations_one_default_per_service;
CREATE UNIQUE INDEX base_locations_one_default_per_service
ON public.base_locations (service_type)
WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.base_locations ENABLE ROW LEVEL SECURITY;

-- Policies: Admins manage; anyone can SELECT active ones (optional) for delivery calc
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='base_locations' AND policyname='Admins manage base locations'
  ) THEN
    CREATE POLICY "Admins manage base locations"
      ON public.base_locations
      FOR ALL
      TO public
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='base_locations' AND policyname='Select active base locations'
  ) THEN
    CREATE POLICY "Select active base locations"
      ON public.base_locations
      FOR SELECT
      TO public
      USING (is_active = true);
  END IF;
END$$;

-- 2) Fee calculation function (delivery only)
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
BEGIN
  IF v_service <> 'delivery' THEN
    RETURN; -- only delivery fees calculated
  END IF;

  SELECT * INTO v_row
  FROM public.base_locations bl
  WHERE bl.service_type='delivery' AND bl.is_active=true
  ORDER BY bl.is_default DESC, bl.priority DESC, bl.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN; -- no base location configured
  END IF;

  v_distance_m := ST_Distance(
    ST_SetSRID(ST_MakePoint(v_row.base_lng, v_row.base_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography
  );

  RETURN QUERY
  SELECT (COALESCE(v_distance_m,0)/1000.0)::NUMERIC AS distance_km,
         (
           COALESCE(v_row.base_fare,0)
           + GREATEST((COALESCE(v_distance_m,0)/1000.0) - COALESCE(v_row.base_km,0), 0) * COALESCE(v_row.per_km_fee,0)
         )::NUMERIC AS fee,
         v_row.id,
         v_row.name;
END;$$;

GRANT EXECUTE ON FUNCTION public.calc_distance_fee_from_geofence(TEXT, DOUBLE PRECISION, DOUBLE PRECISION) TO anon, authenticated;

-- 3) CRUD RPCs used by hooks
-- get_base_locations
CREATE OR REPLACE FUNCTION public.get_base_locations()
RETURNS SETOF public.base_locations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT * FROM public.base_locations ORDER BY created_at DESC; 
$$;
GRANT EXECUTE ON FUNCTION public.get_base_locations() TO anon, authenticated;

-- create_base_location: also ensure only one default per service_type
CREATE OR REPLACE FUNCTION public.create_base_location(p_data public.base_locations)
RETURNS public.base_locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_row public.base_locations;
BEGIN
  IF p_data.is_default THEN
    UPDATE public.base_locations SET is_default=false WHERE service_type=p_data.service_type;
  END IF;

  INSERT INTO public.base_locations (
    name, service_type, base_lat, base_lng, base_fare, base_km, per_km_fee, priority, is_active, is_default
  ) VALUES (
    p_data.name, p_data.service_type, p_data.base_lat, p_data.base_lng, p_data.base_fare, p_data.base_km, p_data.per_km_fee, p_data.priority, p_data.is_active, p_data.is_default
  ) RETURNING * INTO v_row;
  RETURN v_row;
END;$$;
GRANT EXECUTE ON FUNCTION public.create_base_location(public.base_locations) TO authenticated;

-- update_base_location
CREATE OR REPLACE FUNCTION public.update_base_location(p_id uuid, p_data public.base_locations)
RETURNS public.base_locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE v_row public.base_locations; BEGIN
  IF p_data.is_default THEN
    UPDATE public.base_locations SET is_default=false WHERE service_type=p_data.service_type AND id <> p_id;
  END IF;

  UPDATE public.base_locations SET
    name = p_data.name,
    service_type = p_data.service_type,
    base_lat = p_data.base_lat,
    base_lng = p_data.base_lng,
    base_fare = p_data.base_fare,
    base_km = p_data.base_km,
    per_km_fee = p_data.per_km_fee,
    priority = p_data.priority,
    is_active = p_data.is_active,
    is_default = p_data.is_default,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;$$;
GRANT EXECUTE ON FUNCTION public.update_base_location(uuid, public.base_locations) TO authenticated;

-- delete_base_location already exists in this project; ensure grant
GRANT EXECUTE ON FUNCTION public.delete_base_location(uuid) TO authenticated;
