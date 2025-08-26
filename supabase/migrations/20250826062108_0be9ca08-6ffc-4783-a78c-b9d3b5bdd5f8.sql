-- Drop existing policies first
DROP POLICY IF EXISTS "Admin can manage delivery assignments" ON public.delivery_assignments;

-- RLS policies for delivery_assignments table

-- Admins manage everything
CREATE POLICY da_admin_all ON public.delivery_assignments
  AS PERMISSIVE FOR ALL 
  USING (public.is_admin_claim()) 
  WITH CHECK (public.is_admin_claim());