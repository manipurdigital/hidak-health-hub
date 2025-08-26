-- Fix RLS policies for lab_bookings to allow admins to update bookings

-- Drop existing admin/lab staff policies that might be using incorrect functions
DROP POLICY IF EXISTS "Admins and lab staff can view all bookings" ON public.lab_bookings;
DROP POLICY IF EXISTS "Lab staff can update assigned bookings" ON public.lab_bookings;

-- Create proper admin policies using the correct has_admin_access function
CREATE POLICY "Admins can manage all lab bookings" 
ON public.lab_bookings 
FOR ALL 
USING (public.has_admin_access())
WITH CHECK (public.has_admin_access());

-- Update the existing lab staff view policy to use a simpler role check
CREATE POLICY "Lab staff can view all bookings" 
ON public.lab_bookings 
FOR SELECT 
USING (
  public.has_admin_access() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'lab'
  )
);

-- Update the lab staff update policy
CREATE POLICY "Lab staff can update bookings" 
ON public.lab_bookings 
FOR UPDATE 
USING (
  public.has_admin_access() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'lab'
  )
);