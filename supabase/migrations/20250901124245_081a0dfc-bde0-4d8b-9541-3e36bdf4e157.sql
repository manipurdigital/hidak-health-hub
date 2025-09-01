-- Allow admins to view all profiles (fixes admin user list visibility)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (get_current_user_role() = 'admin'::app_role');