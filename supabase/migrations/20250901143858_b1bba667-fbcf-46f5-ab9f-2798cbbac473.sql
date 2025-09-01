-- Migration: Fix addresses schema and add serviceability RPCs to match frontend
-- 1) Addresses table: add missing columns used by UI
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Ensure updated_at auto-updates on UPDATE
DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.get_available_centers_for_location(double precision, double precision, text);
DROP FUNCTION IF EXISTS public.get_service_coverage(double precision, double precision, text);
DROP FUNCTION IF EXISTS public.calc_distance_fee_from_geofence(text, double precision, double precision);

-- 3) Create new RPCs with exact signatures expected by the app

-- a) get_available_centers_for_location(lat, lng, service_type)
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
AS $$
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
    AND g.service_type = service_type
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$$;

-- b) get_service_coverage(lat, lng, service_type)
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as geofence_id,
    g.name as geofence_name,
    g.priority
  FROM public.geofences g
  WHERE g.is_active = true
    AND g.service_type = service_type
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_SetSRID(ST_Point(lng, lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$$;

-- c) calc_distance_fee_from_geofence(p_service, p_dest_lat, p_dest_lng)
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
STABLE
SECURITY DEFINER
AS $$
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
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_SetSRID(ST_Point(p_dest_lng, p_dest_lat), 4326)
    )
  ORDER BY g.priority DESC, g.created_at DESC
  LIMIT 1;

  -- If none found, return empty result
  IF g_id IS NULL THEN
    RETURN;
  END IF;

  -- Simple static fee preview for now (fee of 0)
  RETURN QUERY SELECT 0::double precision AS distance_km, 0::numeric AS fee, g_id AS geofence_id, g_name AS geofence_name;
END;
$$;