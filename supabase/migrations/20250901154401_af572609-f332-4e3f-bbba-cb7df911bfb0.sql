-- Enable PostGIS for geometry functions used in geofence RPCs
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure consistent SRID usage across all spatial functions
CREATE OR REPLACE FUNCTION public.is_location_serviceable(p_lat double precision, p_lng double precision, p_service_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM geofences g
    WHERE g.service_type = p_service_type
      AND g.is_active = true
      AND ST_Contains(
        ST_SetSRID(ST_GeomFromGeoJSON(g.polygon::text), 4326),
        ST_SetSRID(ST_Point(p_lng, p_lat), 4326)
      )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calc_distance_fee_from_geofence(p_service text, p_dest_lat double precision, p_dest_lng double precision)
RETURNS TABLE(distance_km double precision, fee numeric, geofence_id uuid, geofence_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  g_id uuid;
  g_name text;
BEGIN
  SELECT g.id, g.name
  INTO g_id, g_name
  FROM public.geofences g
  WHERE g.is_active = true
    AND g.service_type = p_service
    AND ST_Contains(
      ST_SetSRID(ST_GeomFromGeoJSON(g.polygon::text), 4326),
      ST_SetSRID(ST_Point(p_dest_lng, p_dest_lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC
  LIMIT 1;

  IF g_id IS NULL THEN
    RETURN;
  END IF;

  -- Simple static fee preview for now
  RETURN QUERY SELECT 0::double precision AS distance_km, 0::numeric AS fee, g_id AS geofence_id, g_name AS geofence_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_centers_for_location(lat double precision, lng double precision, service_type text)
RETURNS TABLE(geofence_id uuid, geofence_name text, priority integer, store_id uuid, store_name text, center_id uuid, center_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
      ST_SetSRID(ST_GeomFromGeoJSON(g.polygon::text), 4326),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_service_coverage(lat double precision, lng double precision, service_type text)
RETURNS TABLE(geofence_id uuid, geofence_name text, priority integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
      ST_SetSRID(ST_GeomFromGeoJSON(g.polygon::text), 4326),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$function$;