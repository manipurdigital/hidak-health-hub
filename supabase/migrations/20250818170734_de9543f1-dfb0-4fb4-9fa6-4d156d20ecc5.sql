-- Create geofences table for service areas
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  center_id UUID REFERENCES public.diagnostic_centers(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('delivery', 'lab_collection')),
  polygon_coordinates JSONB NOT NULL, -- Store polygon coordinates as GeoJSON
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- For overlapping areas, higher priority wins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all geofences" 
ON public.geofences 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Centers can view their own geofences" 
ON public.geofences 
FOR SELECT 
USING (
  center_id IN (
    SELECT cs.center_id 
    FROM center_staff cs 
    WHERE cs.user_id = auth.uid() AND cs.is_active = true
  ) OR 
  store_id IN (
    SELECT s.id 
    FROM stores s 
    WHERE s.id = store_id -- Store staff access would need separate table
  )
);

-- Create index for performance
CREATE INDEX idx_geofences_service_type ON public.geofences(service_type);
CREATE INDEX idx_geofences_center_id ON public.geofences(center_id);
CREATE INDEX idx_geofences_store_id ON public.geofences(store_id);
CREATE INDEX idx_geofences_active ON public.geofences(is_active);

-- Function to check if a point is inside any geofence
CREATE OR REPLACE FUNCTION public.check_point_serviceability(
  lat NUMERIC,
  lng NUMERIC,
  service_type TEXT
) RETURNS TABLE(
  geofence_id UUID,
  center_id UUID,
  store_id UUID,
  name TEXT,
  priority INTEGER
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.center_id,
    g.store_id,
    g.name,
    g.priority
  FROM public.geofences g
  WHERE g.service_type = check_point_serviceability.service_type
    AND g.is_active = true
    AND ST_Contains(
      ST_GeomFromGeoJSON(g.polygon_coordinates::text),
      ST_Point(lng, lat)
    )
  ORDER BY g.priority DESC, g.created_at ASC;
END;
$$;

-- Function to get available centers for a location
CREATE OR REPLACE FUNCTION public.get_available_centers_for_location(
  lat NUMERIC,
  lng NUMERIC,
  service_type TEXT
) RETURNS TABLE(
  center_id UUID,
  center_name TEXT,
  store_id UUID,
  store_name TEXT,
  geofence_name TEXT,
  priority INTEGER
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  IF service_type = 'lab_collection' THEN
    RETURN QUERY
    SELECT 
      dc.id,
      dc.name,
      NULL::UUID,
      NULL::TEXT,
      g.name,
      g.priority
    FROM public.geofences g
    JOIN public.diagnostic_centers dc ON dc.id = g.center_id
    WHERE g.service_type = 'lab_collection'
      AND g.is_active = true
      AND dc.is_active = true
      AND ST_Contains(
        ST_GeomFromGeoJSON(g.polygon_coordinates::text),
        ST_Point(lng, lat)
      )
    ORDER BY g.priority DESC, g.created_at ASC;
  ELSE
    RETURN QUERY
    SELECT 
      NULL::UUID,
      NULL::TEXT,
      s.id,
      s.name,
      g.name,
      g.priority
    FROM public.geofences g
    JOIN public.stores s ON s.id = g.store_id
    WHERE g.service_type = 'delivery'
      AND g.is_active = true
      AND s.is_active = true
      AND ST_Contains(
        ST_GeomFromGeoJSON(g.polygon_coordinates::text),
        ST_Point(lng, lat)
      )
    ORDER BY g.priority DESC, g.created_at ASC;
  END IF;
END;
$$;

-- Add PostGIS extension if not exists (for geometry functions)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Update trigger
CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();