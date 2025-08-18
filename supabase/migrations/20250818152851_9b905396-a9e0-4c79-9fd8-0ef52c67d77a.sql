-- Add new roles for center staff
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'center_staff';

-- Add center-related fields to lab_bookings table
ALTER TABLE public.lab_bookings 
ADD COLUMN collector_name text,
ADD COLUMN eta timestamp with time zone,
ADD COLUMN collected_at timestamp with time zone,
ADD COLUMN reschedule_reason text;

-- Update status values to include new states (we'll modify the check constraint if it exists)
-- First, let's add the new status values without constraint issues
UPDATE public.lab_bookings 
SET status = 'assigned' 
WHERE status = 'pending';

-- Add center-related RLS policies
CREATE POLICY "Center staff can view assigned bookings" 
ON public.lab_bookings 
FOR SELECT 
USING (
  has_role(auth.uid(), 'center'::app_role) OR 
  has_role(auth.uid(), 'center_staff'::app_role)
);

CREATE POLICY "Center staff can update assigned bookings" 
ON public.lab_bookings 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'center'::app_role) OR 
  has_role(auth.uid(), 'center_staff'::app_role)
);

-- Enable realtime for lab_bookings table
ALTER TABLE public.lab_bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_bookings;