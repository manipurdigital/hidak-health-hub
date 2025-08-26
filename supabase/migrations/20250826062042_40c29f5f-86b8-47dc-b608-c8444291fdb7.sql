-- Drop existing policies first
DROP POLICY IF EXISTS "Admin can manage delivery assignments" ON public.delivery_assignments;

-- RLS policies for delivery_assignments table

-- Admins manage everything
CREATE POLICY da_admin_all ON public.delivery_assignments
  AS PERMISSIVE FOR ALL 
  USING (public.is_admin_claim()) 
  WITH CHECK (public.is_admin_claim());

-- Riders: see only their jobs
CREATE POLICY da_rider_select ON public.delivery_assignments
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = rider_id AND r.user_id = auth.uid()
  ));

-- Riders can update status on their jobs (start/complete) only
CREATE POLICY da_rider_update ON public.delivery_assignments
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = rider_id AND r.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = rider_id AND r.user_id = auth.uid()
  ));