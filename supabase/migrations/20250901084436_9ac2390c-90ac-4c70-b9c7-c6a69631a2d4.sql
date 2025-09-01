-- Add patient details and location columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_location_lat DOUBLE PRECISION;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS patient_location_lng DOUBLE PRECISION;

-- Add RLS policy for admins to view all orders
CREATE POLICY "Admins can view all orders" ON public.orders
FOR SELECT
USING (get_current_user_role() = 'admin'::app_role);

-- Add RLS policy for admins to view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
FOR SELECT
USING (get_current_user_role() = 'admin'::app_role);