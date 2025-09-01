
-- 1) Extend addresses table to match UI payload
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'home',
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Helpful index for reads by user
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);

-- 2) Keep updated_at fresh on updates (uses existing function public.update_updated_at_column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_addresses'
  ) THEN
    CREATE TRIGGER set_timestamp_addresses
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 3) RPCs to align with frontend parameter names and flows

-- 3a) get_available_centers_for_location(lat, lng, service_type)
-- Returns partners for a coordinate based on active geofences.
-- Note: We allow both delivery (stores) and lab_collection (centers) via the same shape.
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
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id AS geofence_id,
    g.name AS geofence_name,
    g.priority,
    CASE WHEN service_type = 'delivery' THEN s.id ELSE NULL END AS store_id,
    CASE WHEN service_type = 'delivery' THEN s.name ELSE NULL END AS store_name,
    CASE WHEN service_type = 'lab_collection' THEN c.id ELSE NULL END AS center_id,
    CASE WHEN service_type = 'lab_collection' THEN c.name ELSE NULL END AS center_name
  FROM public.geofences g
  LEFT JOIN public.stores   s ON s.id = g.store_id
  LEFT JOIN public.centers  c ON c.id = g.center_id
  WHERE g.service_type = service_type
    AND g.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon::text),
      ST_Point(lng, lat)
    )
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$$;

-- 3b) get_service_coverage(lat, lng, service_type)
-- Coverage-only check used when no partners found.
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
AS $$
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
  ORDER BY g.priority DESC, g.created_at DESC;
END;
$$;

-- 3c) calc_distance_fee_from_geofence(p_service, p_dest_lat, p_dest_lng)
-- Minimal implementation to unblock UI; returns zero fee and 0 distance if no geofence matched.
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
AS $$
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT 
      g.id, g.name, g.priority
    FROM public.geofences g
    WHERE g.service_type = p_service
      AND g.is_active = true
      AND ST_Contains(
        ST_GeomFromGeoJSON(g.polygon::text),
        ST_Point(p_dest_lng, p_dest_lat)
      )
    ORDER BY g.priority DESC, g.created_at DESC
    LIMIT 1
  )
  SELECT 
    0::double precision AS distance_km,
    0::numeric          AS fee,
    m.id                AS geofence_id,
    m.name              AS geofence_name
  FROM matched m
  UNION ALL
  SELECT 0, 0, NULL::uuid, NULL::text
  WHERE NOT EXISTS (SELECT 1 FROM matched);
END;
$$;
