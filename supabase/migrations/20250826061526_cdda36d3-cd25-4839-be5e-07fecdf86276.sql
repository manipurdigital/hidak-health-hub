-- Drop existing view if it exists and recreate it
DROP VIEW IF EXISTS public.v_order_delivery_assignment;

-- Customer-friendly view (order → assignment)
-- Assumes orders(order_number text unique, user_id uuid, …) already exists & has RLS 
-- so users can read their own orders.

CREATE VIEW public.v_order_delivery_assignment AS
SELECT
  o.order_number,
  da.status, 
  da.assigned_at, 
  da.picked_up_at, 
  da.delivered_at,
  r.code AS rider_code,
  r.full_name AS rider_name
FROM public.orders o
JOIN public.delivery_assignments da ON da.order_id = o.id
LEFT JOIN public.riders r ON r.id = da.rider_id;