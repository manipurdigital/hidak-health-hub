-- Allow admins to update order status (and any fields) on public.orders
-- Uses user_roles table to check admin role

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for UPDATE for admins
CREATE POLICY "Admins can update any order"
ON public.orders
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Optional: ensure admins can SELECT everything (if not already)
CREATE POLICY "Admins can view all orders"
ON public.orders
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
