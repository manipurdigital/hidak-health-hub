
-- Fix ambiguous column reference by using a local variable for the parameter `service_type`

CREATE OR REPLACE FUNCTION public.get_available_centers_for_location(
  lat double precision,
  lng double precision,
  service_type text
)
RETURNS TABLE(
  geofence_id uuid,
  geofence_name text,
  priority integer,
  store_id uuid,
  store_name text,
  center_id uuid,
  center_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
  v_service_type text := service_type;
BEGIN
  RETURN QUERY
  SELECT 
    g.id as geofence_id,
    g.name as geofence_name,
    g.priority,
    g.store_id,
    s.name as store_name,
    g.center_id,
    dc.name as center_name
  FROM public.geofences g
  LEFT JOIN public.stores s ON s.id = g.store_id AND s.is_active = true
  LEFT JOIN public.diagnostic_centers dc ON dc.id = g.center_id AND dc.is_active = true
  WHERE g.is_active = true
    AND g.service_type = v_service_type
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_service_coverage(
  lat double precision,
  lng double precision,
  service_type text
)
RETURNS TABLE(
  geofence_id uuid,
  geofence_name text,
  priority integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
  v_service_type text := service_type;
BEGIN
  RETURN QUERY
  SELECT 
    g.id as geofence_id,
    g.name as geofence_name,
    g.priority
  FROM public.geofences g
  WHERE g.is_active = true
    AND g.service_type = v_service_type
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$function$;
