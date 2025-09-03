-- Add RLS policy for admins to view all consultations
CREATE POLICY "Admins can view all consultations" ON public.consultations
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);