
-- 1) Add missing columns to public.addresses used by the UI
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Ensure updated_at is refreshed on updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_addresses_updated_at'
  ) THEN
    CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- 2) RPCs expected by the app (exact names and parameters)

-- 2a) Partners/assignable resources inside geofence for a given service
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
  center_name text,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    g.id AS geofence_id,
    g.name AS geofence_name,
    g.priority,
    g.store_id,
    s.name AS store_name,
    g.center_id,
    c.name AS center_name,
    COALESCE(c.is_available, s.is_active, true) AS is_available
  FROM public.geofences g
  LEFT JOIN public.stores  s ON s.id = g.store_id
  LEFT JOIN public.centers c ON c.id = g.center_id
  WHERE g.service_type = service_type
    AND g.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_Point(lng, lat)
    )
  ORDER BY g.priority DESC;
END;
$function$;

-- 2b) Coverage-only check (when there are no partners)
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
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    g.id AS geofence_id,
    g.name AS geofence_name,
    g.priority
  FROM public.geofences g
  WHERE g.service_type = service_type
    AND g.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_Point(lng, lat)
    )
  ORDER BY g.priority DESC;
END;
$function$;

-- 2c) Fee preview (benign values to unblock UI)
CREATE OR REPLACE FUNCTION public.calc_distance_fee_from_geofence(
  p_service text,
  p_dest_lat double precision,
  p_dest_lng double precision
)
RETURNS TABLE(
  distance_km numeric,
  fee numeric,
  geofence_id uuid,
  geofence_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    0::numeric AS distance_km,
    0::numeric AS fee,
    g.id       AS geofence_id,
    g.name     AS geofence_name
  FROM public.geofences g
  WHERE g.service_type = p_service
    AND g.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_Point(p_dest_lng, p_dest_lat)
    )
  ORDER BY g.priority DESC
  LIMIT 1;
END;
$function$;
