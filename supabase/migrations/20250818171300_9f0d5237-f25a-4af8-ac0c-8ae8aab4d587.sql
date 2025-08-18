-- Add new columns to geofences table for enhanced functionality
ALTER TABLE public.geofences 
ADD COLUMN color TEXT DEFAULT '#4285F4',
ADD COLUMN capacity_per_day INTEGER,
ADD COLUMN min_order_value NUMERIC,
ADD COLUMN working_hours JSONB DEFAULT '{}',
ADD COLUMN notes TEXT,
ADD COLUMN shape_type TEXT DEFAULT 'polygon' CHECK (shape_type IN ('polygon', 'circle')),
ADD COLUMN area_km2 NUMERIC,
ADD COLUMN radius_meters NUMERIC;

-- Update the polygon_coordinates column to store both polygon and circle data
-- For circles: store as {type: 'Circle', center: [lng, lat], radius: meters}
-- For polygons: keep existing GeoJSON format

-- Create index for performance on new columns
CREATE INDEX idx_geofences_color ON public.geofences(color);
CREATE INDEX idx_geofences_capacity ON public.geofences(capacity_per_day);
CREATE INDEX idx_geofences_shape_type ON public.geofences(shape_type);

-- Function to calculate area for polygons
CREATE OR REPLACE FUNCTION public.calculate_polygon_area(coordinates JSONB)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  geom geometry;
  area_m2 NUMERIC;
  area_km2 NUMERIC;
BEGIN
  -- Convert GeoJSON to PostGIS geometry
  geom := ST_GeomFromGeoJSON(coordinates::text);
  
  -- Calculate area in square meters using geodesic calculation
  area_m2 := ST_Area(geom::geography);
  
  -- Convert to square kilometers
  area_km2 := area_m2 / 1000000.0;
  
  RETURN ROUND(area_km2, 3);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Function to update area when geofence is created/updated
CREATE OR REPLACE FUNCTION public.update_geofence_area()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate area for polygons
  IF NEW.shape_type = 'polygon' THEN
    NEW.area_km2 := calculate_polygon_area(NEW.polygon_coordinates);
  ELSIF NEW.shape_type = 'circle' AND NEW.radius_meters IS NOT NULL THEN
    -- Calculate area for circles: π * r²
    NEW.area_km2 := ROUND((3.14159 * POWER(NEW.radius_meters / 1000.0, 2)), 3);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update area
CREATE TRIGGER update_geofence_area_trigger
  BEFORE INSERT OR UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_geofence_area();

-- Function to check if a point is serviceable with enhanced logic
CREATE OR REPLACE FUNCTION public.check_enhanced_serviceability(
  lat NUMERIC,
  lng NUMERIC,
  service_type TEXT,
  order_value NUMERIC DEFAULT NULL
) RETURNS TABLE(
  geofence_id UUID,
  center_id UUID,
  store_id UUID,
  name TEXT,
  priority INTEGER,
  color TEXT,
  min_order_value NUMERIC,
  is_serviceable BOOLEAN,
  reason TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.center_id,
    g.store_id,
    g.name,
    g.priority,
    g.color,
    g.min_order_value,
    CASE 
      WHEN NOT g.is_active THEN FALSE
      WHEN g.min_order_value IS NOT NULL AND (order_value IS NULL OR order_value < g.min_order_value) THEN FALSE
      ELSE TRUE
    END as is_serviceable,
    CASE 
      WHEN NOT g.is_active THEN 'Geofence is inactive'
      WHEN g.min_order_value IS NOT NULL AND (order_value IS NULL OR order_value < g.min_order_value) THEN 'Order value below minimum'
      ELSE 'Serviceable'
    END as reason
  FROM public.geofences g
  WHERE g.service_type = check_enhanced_serviceability.service_type
    AND (
      (g.shape_type = 'polygon' AND ST_Contains(
        ST_GeomFromGeoJSON(g.polygon_coordinates::text),
        ST_Point(lng, lat)
      ))
      OR
      (g.shape_type = 'circle' AND ST_DWithin(
        ST_Point((g.polygon_coordinates->>'center'->>0)::NUMERIC, (g.polygon_coordinates->>'center'->>1)::NUMERIC)::geography,
        ST_Point(lng, lat)::geography,
        g.radius_meters
      ))
    )
  ORDER BY g.priority DESC, g.created_at ASC;
END;
$$;