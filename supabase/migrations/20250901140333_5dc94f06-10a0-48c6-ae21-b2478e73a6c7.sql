
-- 1) Overload to match frontend signature:
--    get_available_centers_for_location(lat, lng, service_type)
CREATE OR REPLACE FUNCTION public.get_available_centers_for_location(
  lat double precision,
  lng double precision,
  service_type text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  address text,
  phone text,
  email text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.address,
    c.phone,
    c.email,
    c.latitude,
    c.longitude,
    CASE 
      WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL THEN
        ROUND(
          SQRT(POWER(c.latitude - lat, 2) + POWER(c.longitude - lng, 2)) * 111.32
        , 2)
      ELSE 0
    END as distance_km,
    c.is_available
  FROM public.centers c
  WHERE c.is_available = true
  ORDER BY distance_km;
END;
$function$;

-- 2) Add get_service_coverage(lat, lng, service_type)
CREATE OR REPLACE FUNCTION public.get_service_coverage(
  lat double precision,
  lng double precision,
  service_type text
)
RETURNS TABLE(
  geofence_id uuid,
  geofence_name text,
  service_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as geofence_id,
    g.name as geofence_name,
    g.service_type
  FROM public.geofences g
  WHERE g.is_active = true
    AND g.service_type = service_type
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_Point(lng, lat)
    );
END;
$function$;

-- 3) Add calc_distance_fee_from_geofence(p_service, p_dest_lat, p_dest_lng)
--    Placeholder implementation: returns nearest center distance and fee = 0
CREATE OR REPLACE FUNCTION public.calc_distance_fee_from_geofence(
  p_service text,
  p_dest_lat double precision,
  p_dest_lng double precision
)
RETURNS TABLE(
  distance_km double precision,
  fee numeric,
  geofence_id uuid,
  geofence_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  c_id uuid;
  c_name text;
  c_lat double precision;
  c_lng double precision;
  dist_km double precision;
BEGIN
  -- Find nearest available center
  SELECT c.id, c.name, c.latitude, c.longitude
  INTO c_id, c_name, c_lat, c_lng
  FROM public.centers c
  WHERE c.is_available = true
    AND c.latitude IS NOT NULL
    AND c.longitude IS NOT NULL
  ORDER BY SQRT(POWER(c.latitude - p_dest_lat, 2) + POWER(c.longitude - p_dest_lng, 2))
  LIMIT 1;

  IF c_id IS NULL THEN
    RETURN; -- no rows
  END IF;

  dist_km := ROUND(
    SQRT(POWER(c_lat - p_dest_lat, 2) + POWER(c_lng - p_dest_lng, 2)) * 111.32
  , 2);

  -- Placeholder: fee = 0 (keeps UI working without showing an incorrect number)
  RETURN QUERY
  SELECT dist_km, 0::numeric AS fee, NULL::uuid AS geofence_id, NULL::text AS geofence_name;
END;
$function$;
