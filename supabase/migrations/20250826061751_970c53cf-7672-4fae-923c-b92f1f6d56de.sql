-- RLS policies for riders table

-- Admins manage all riders
CREATE POLICY riders_admin_all ON public.riders
  AS PERMISSIVE FOR ALL 
  USING (public.is_admin_claim()) 
  WITH CHECK (public.is_admin_claim());

-- Rider can read their own record (by auth)
CREATE POLICY rider_self ON public.riders
  FOR SELECT 
  USING (user_id = auth.uid());

-- Rider can update their own record (by auth)
CREATE POLICY rider_self_update ON public.riders
  FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());