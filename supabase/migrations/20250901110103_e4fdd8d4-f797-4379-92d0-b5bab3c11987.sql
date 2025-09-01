-- Drop existing admin update policy and recreate with consistent function usage
DROP POLICY "Admins can update any order" ON public.orders;

-- Recreate with consistent function usage matching the SELECT policy  
CREATE POLICY "Admins can update any order"
ON public.orders
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);