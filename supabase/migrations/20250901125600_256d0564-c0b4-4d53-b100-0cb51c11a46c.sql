-- Add store_id field to geofences table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geofences' AND column_name = 'store_id') THEN
    ALTER TABLE public.geofences ADD COLUMN store_id uuid;
  END IF;
END $$;

-- Create function to check if location is within any active geofence for a service type
CREATE OR REPLACE FUNCTION public.is_location_serviceable(
  p_lat double precision,
  p_lng double precision,
  p_service_type text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM geofences g
    WHERE g.service_type = p_service_type
      AND g.is_active = true
      AND ST_Contains(
        ST_GeomFromGeoJSON(g.polygon::text),
        ST_Point(p_lng, p_lat)
      )
  );
END;
$$;

-- Add geofence validation fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_within_service_area boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS geofence_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assignment_notes text;

-- Add geofence validation fields to lab_bookings table  
ALTER TABLE public.lab_bookings
ADD COLUMN IF NOT EXISTS is_within_service_area boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS geofence_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assignment_notes text;

-- Create admin notification log table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'whatsapp_sent', 'assignment_made', etc
  entity_type text NOT NULL, -- 'order', 'lab_booking'
  entity_id uuid NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage notifications
CREATE POLICY "Admins can manage notifications"
ON public.admin_notifications
FOR ALL
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);