
-- 1) Drop conflicting/old function overloads to remove ambiguity
DROP FUNCTION IF EXISTS public.create_base_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER);
DROP FUNCTION IF EXISTS public.create_base_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.create_base_location(public.base_locations);

DROP FUNCTION IF EXISTS public.update_base_location(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER);
DROP FUNCTION IF EXISTS public.update_base_location(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_base_location(UUID, public.base_locations);

-- Optional: ensure get_base_locations exists in a clean state
DROP FUNCTION IF EXISTS public.get_base_locations();

-- 2) Recreate a single get_base_locations that respects RLS (invoker)
CREATE OR REPLACE FUNCTION public.get_base_locations()
RETURNS SETOF public.base_locations
LANGUAGE sql
AS $$
  SELECT *
  FROM public.base_locations
  ORDER BY priority DESC, created_at DESC;
$$;

-- 3) Recreate a single canonical create_base_location
--    Parameter order matches the frontend hooks:
--      ... p_per_km_fee, p_priority, p_is_active, p_is_default
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
SET search_path = public
AS $$
DECLARE
  v_row public.base_locations;
BEGIN
  -- Ensure only admins can write
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Ensure single default per service_type
  IF p_is_default THEN
    UPDATE public.base_locations
    SET is_default = false
    WHERE service_type = p_service_type;
  END IF;

  INSERT INTO public.base_locations (
    name, service_type, base_lat, base_lng,
    base_fare, base_km, per_km_fee,
    priority, is_active, is_default
  ) VALUES (
    p_name, p_service_type, p_base_lat, p_base_lng,
    p_base_fare, p_base_km, p_per_km_fee,
    p_priority, p_is_active, p_is_default
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 4) Recreate a single canonical update_base_location
--    Parameter order matches the frontend hooks:
--      ... p_per_km_fee, p_priority, p_is_active, p_is_default
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
SET search_path = public
AS $$
DECLARE
  v_row public.base_locations;
  v_effective_service_type TEXT;
BEGIN
  -- Ensure only admins can write
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- When making something default, clear others for that service_type
  v_effective_service_type := COALESCE(
    p_service_type,
    (SELECT service_type FROM public.base_locations WHERE id = p_id)
  );

  IF p_is_default IS TRUE THEN
    UPDATE public.base_locations
    SET is_default = false
    WHERE service_type = v_effective_service_type
      AND id <> p_id;
  END IF;

  UPDATE public.base_locations
  SET
    name = COALESCE(p_name, name),
    service_type = COALESCE(p_service_type, service_type),
    base_lat = COALESCE(p_base_lat, base_lat),
    base_lng = COALESCE(p_base_lng, base_lng),
    base_fare = COALESCE(p_base_fare, base_fare),
    base_km = COALESCE(p_base_km, base_km),
    per_km_fee = COALESCE(p_per_km_fee, per_km_fee),
    priority = COALESCE(p_priority, priority),
    is_active = COALESCE(p_is_active, is_active),
    is_default = COALESCE(p_is_default, is_default),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 5) Grants (get_base_locations respects RLS; write RPCs are SECURITY DEFINER but admin-guarded)
GRANT EXECUTE ON FUNCTION public.get_base_locations() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_base_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_base_location(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;
