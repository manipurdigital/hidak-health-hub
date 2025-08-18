-- RLS policies for stores
CREATE POLICY "Admins can manage all stores" 
ON public.stores 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Stores are viewable by authenticated users" 
ON public.stores 
FOR SELECT 
USING (is_active = true AND auth.role() = 'authenticated');

-- Function to get medicine sales by store
CREATE OR REPLACE FUNCTION public.medicine_sales_by_store(start_date date, end_date date)
 RETURNS TABLE(store_name text, orders bigint, revenue numeric, aov numeric, top_medicine text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH store_sales AS (
    SELECT 
      COALESCE(s.name, 'Online Store') as store_name,
      COUNT(o.id)::BIGINT as orders,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      CASE WHEN COUNT(o.id) > 0 THEN ROUND(SUM(o.total_amount) / COUNT(o.id), 2) ELSE 0 END as aov
    FROM orders o
    LEFT JOIN stores s ON o.store_id = s.id
    WHERE o.created_at::DATE >= start_date 
      AND o.created_at::DATE <= end_date
      AND o.payment_status = 'paid'
    GROUP BY s.id, s.name
  ),
  store_top_medicines AS (
    SELECT 
      COALESCE(s.name, 'Online Store') as store_name,
      m.name as medicine_name,
      SUM(oi.total_price) as medicine_revenue,
      ROW_NUMBER() OVER (PARTITION BY COALESCE(s.name, 'Online Store') ORDER BY SUM(oi.total_price) DESC) as rn
    FROM orders o
    LEFT JOIN stores s ON o.store_id = s.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN medicines m ON oi.medicine_id = m.id
    WHERE o.created_at::DATE >= start_date 
      AND o.created_at::DATE <= end_date
      AND o.payment_status = 'paid'
    GROUP BY s.id, s.name, m.id, m.name
  )
  SELECT 
    ss.store_name,
    ss.orders,
    ss.revenue,
    ss.aov,
    COALESCE(stm.medicine_name, '-') as top_medicine
  FROM store_sales ss
  LEFT JOIN store_top_medicines stm ON ss.store_name = stm.store_name AND stm.rn = 1
  ORDER BY ss.revenue DESC;
$function$