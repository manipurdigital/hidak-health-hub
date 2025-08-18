-- Fix infinite recursion in center_staff RLS policy and add performance optimizations

-- First, fix the infinite recursion in center_staff by using a security definer function
CREATE OR REPLACE FUNCTION public.get_user_center_access(user_id_param uuid)
RETURNS TABLE(center_id uuid, role text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cs.center_id, cs.role
  FROM center_staff cs
  WHERE cs.user_id = user_id_param AND cs.is_active = true;
$$;

-- Drop existing problematic policies for center_staff
DROP POLICY IF EXISTS "Center users can view staff in their center" ON center_staff;

-- Recreate the policy using the security definer function
CREATE POLICY "Center users can view staff in their center" ON center_staff
FOR SELECT
USING (
  is_active = true AND 
  center_id IN (
    SELECT guca.center_id FROM get_user_center_access(auth.uid()) guca
  )
);

-- Add polygon vertex validation function
CREATE OR REPLACE FUNCTION public.validate_polygon_vertices(polygon_coords jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Check if polygon coordinates exist and are valid GeoJSON
  IF polygon_coords IS NULL THEN
    RETURN false;
  END IF;
  
  -- For GeoJSON Polygon, check coordinates array length
  IF polygon_coords->>'type' = 'Polygon' THEN
    -- Get the exterior ring (first array in coordinates)
    DECLARE
      exterior_ring jsonb := polygon_coords->'coordinates'->0;
      vertex_count integer;
    BEGIN
      IF exterior_ring IS NULL THEN
        RETURN false;
      END IF;
      
      vertex_count := jsonb_array_length(exterior_ring);
      
      -- Ensure polygon has at least 4 vertices (closed polygon) and no more than 100
      RETURN vertex_count >= 4 AND vertex_count <= 100;
    END;
  END IF;
  
  -- For other geometry types, assume valid for now
  RETURN true;
END;
$$;

-- Add trigger to validate polygon vertices on geofences
CREATE OR REPLACE FUNCTION public.validate_geofence_before_save()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate polygon vertex count
  IF NOT validate_polygon_vertices(NEW.polygon_coordinates) THEN
    RAISE EXCEPTION 'Polygon must have between 4 and 100 vertices';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for geofence validation
DROP TRIGGER IF EXISTS validate_geofence_trigger ON geofences;
CREATE TRIGGER validate_geofence_trigger
  BEFORE INSERT OR UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION validate_geofence_before_save();

-- Add basic performance indexes (without problematic function indexes)
CREATE INDEX IF NOT EXISTS idx_geofences_active_service_type 
ON geofences (is_active, service_type) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_lab_bookings_center_date 
ON lab_bookings (center_id, booking_date) 
WHERE status != 'cancelled';

-- Enable RLS on PostGIS system tables (fix critical security issue)
ALTER TABLE geography_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE geometry_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Add restrictive policies for PostGIS system tables
DROP POLICY IF EXISTS "Restrict geography_columns access" ON geography_columns;
CREATE POLICY "Restrict geography_columns access" ON geography_columns
FOR ALL USING (false);

DROP POLICY IF EXISTS "Restrict geometry_columns access" ON geometry_columns;
CREATE POLICY "Restrict geometry_columns access" ON geometry_columns  
FOR ALL USING (false);

DROP POLICY IF EXISTS "Restrict spatial_ref_sys access" ON spatial_ref_sys;
CREATE POLICY "Restrict spatial_ref_sys access" ON spatial_ref_sys
FOR ALL USING (false);