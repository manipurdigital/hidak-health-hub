-- RPC functions for base location management

-- Get all base locations
CREATE OR REPLACE FUNCTION public.get_base_locations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  service_type TEXT,
  base_lat DOUBLE PRECISION,
  base_lng DOUBLE PRECISION,
  base_fare NUMERIC,
  base_km NUMERIC,
  per_km_fee NUMERIC,
  is_active BOOLEAN,
  is_default BOOLEAN,
  priority INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bl.id,
    bl.name,
    bl.service_type,
    bl.base_lat,
    bl.base_lng,
    bl.base_fare,
    bl.base_km,
    bl.per_km_fee,
    bl.is_active,
    bl.is_default,
    bl.priority,
    bl.created_at,
    bl.updated_at
  FROM public.base_locations bl
  ORDER BY bl.priority DESC, bl.created_at DESC;
END;
$$;

-- Create base location
CREATE OR REPLACE FUNCTION public.create_base_location(
  p_name TEXT,
  p_service_type TEXT,
  p_base_lat DOUBLE PRECISION,
  p_base_lng DOUBLE PRECISION,
  p_base_fare NUMERIC,
  p_base_km NUMERIC,
  p_per_km_fee NUMERIC,
  p_is_active BOOLEAN,
  p_is_default BOOLEAN,
  p_priority INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- If setting as default, unset any existing defaults for this service type
  IF p_is_default = true THEN
    UPDATE public.base_locations 
    SET is_default = false 
    WHERE service_type = p_service_type AND is_default = true;
  END IF;

  INSERT INTO public.base_locations (
    name, service_type, base_lat, base_lng, base_fare, 
    base_km, per_km_fee, is_active, is_default, priority
  ) VALUES (
    p_name, p_service_type, p_base_lat, p_base_lng, p_base_fare,
    p_base_km, p_per_km_fee, p_is_active, p_is_default, p_priority
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Update base location
CREATE OR REPLACE FUNCTION public.update_base_location(
  p_id UUID,
  p_name TEXT,
  p_service_type TEXT,
  p_base_lat DOUBLE PRECISION,
  p_base_lng DOUBLE PRECISION,
  p_base_fare NUMERIC,
  p_base_km NUMERIC,
  p_per_km_fee NUMERIC,
  p_is_active BOOLEAN,
  p_is_default BOOLEAN,
  p_priority INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If setting as default, unset any existing defaults for this service type
  IF p_is_default = true THEN
    UPDATE public.base_locations 
    SET is_default = false 
    WHERE service_type = p_service_type AND is_default = true AND id != p_id;
  END IF;

  UPDATE public.base_locations SET
    name = p_name,
    service_type = p_service_type,
    base_lat = p_base_lat,
    base_lng = p_base_lng,
    base_fare = p_base_fare,
    base_km = p_base_km,
    per_km_fee = p_per_km_fee,
    is_active = p_is_active,
    is_default = p_is_default,
    priority = p_priority,
    updated_at = now()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

-- Delete base location
CREATE OR REPLACE FUNCTION public.delete_base_location(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.base_locations WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_base_locations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_base_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_base_location(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_base_location(UUID) TO authenticated;