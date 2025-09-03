-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_base_locations();
DROP FUNCTION IF EXISTS public.create_base_location(public.base_locations);
DROP FUNCTION IF EXISTS public.update_base_location(uuid, public.base_locations);

-- Create base_locations table and policies if missing
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

-- Policies
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

-- CRUD RPCs
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

-- create_base_location with individual parameters
CREATE OR REPLACE FUNCTION public.create_base_location(
  p_name TEXT,
  p_service_type TEXT,
  p_base_lat DOUBLE PRECISION,
  p_base_lng DOUBLE PRECISION,
  p_base_fare NUMERIC,
  p_base_km NUMERIC,
  p_per_km_fee NUMERIC,
  p_priority INTEGER,
  p_is_active BOOLEAN,
  p_is_default BOOLEAN
)
RETURNS public.base_locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_row public.base_locations;
BEGIN
  IF p_is_default THEN
    UPDATE public.base_locations SET is_default=false WHERE service_type=p_service_type;
  END IF;

  INSERT INTO public.base_locations (
    name, service_type, base_lat, base_lng, base_fare, base_km, per_km_fee, priority, is_active, is_default
  ) VALUES (
    p_name, p_service_type, p_base_lat, p_base_lng, p_base_fare, p_base_km, p_per_km_fee, p_priority, p_is_active, p_is_default
  ) RETURNING * INTO v_row;
  RETURN v_row;
END;$$;
GRANT EXECUTE ON FUNCTION public.create_base_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;

-- update_base_location with individual parameters
CREATE OR REPLACE FUNCTION public.update_base_location(
  p_id UUID,
  p_name TEXT,
  p_service_type TEXT,
  p_base_lat DOUBLE PRECISION,
  p_base_lng DOUBLE PRECISION,
  p_base_fare NUMERIC,
  p_base_km NUMERIC,
  p_per_km_fee NUMERIC,
  p_priority INTEGER,
  p_is_active BOOLEAN,
  p_is_default BOOLEAN
)
RETURNS public.base_locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE 
  v_row public.base_locations; 
BEGIN
  IF p_is_default THEN
    UPDATE public.base_locations SET is_default=false WHERE service_type=p_service_type AND id <> p_id;
  END IF;

  UPDATE public.base_locations SET
    name = p_name,
    service_type = p_service_type,
    base_lat = p_base_lat,
    base_lng = p_base_lng,
    base_fare = p_base_fare,
    base_km = p_base_km,
    per_km_fee = p_per_km_fee,
    priority = p_priority,
    is_active = p_is_active,
    is_default = p_is_default,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;$$;
GRANT EXECUTE ON FUNCTION public.update_base_location(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;