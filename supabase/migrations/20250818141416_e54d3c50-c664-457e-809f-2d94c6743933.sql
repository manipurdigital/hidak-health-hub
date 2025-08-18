-- Create function for admin/analyst access check
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'analyst')
  )
$$;

-- Create materialized view for daily analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.daily_analytics AS
SELECT 
  date_trunc('day', o.created_at)::date as date,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  COUNT(DISTINCT o.user_id) as unique_customers,
  AVG(o.total_amount) as avg_order_value,
  COUNT(CASE WHEN o.payment_method = 'prepaid' THEN 1 END) as prepaid_orders,
  COUNT(CASE WHEN o.payment_method = 'cod' THEN 1 END) as cod_orders,
  SUM(CASE WHEN o.payment_method = 'prepaid' THEN o.total_amount ELSE 0 END) as prepaid_revenue,
  SUM(CASE WHEN o.payment_method = 'cod' THEN o.total_amount ELSE 0 END) as cod_revenue
FROM orders o
WHERE o.payment_status = 'paid'
  AND o.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY date_trunc('day', o.created_at)::date;

-- Create materialized view for medicine performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.medicine_performance AS
SELECT 
  m.id as medicine_id,
  m.name as medicine_name,
  m.category_id,
  SUM(oi.total_price) as total_revenue,
  SUM(oi.quantity) as total_quantity,
  COUNT(DISTINCT oi.order_id) as order_count,
  COUNT(DISTINCT o.user_id) as unique_customers,
  AVG(oi.unit_price) as avg_unit_price,
  MAX(o.created_at) as last_ordered
FROM order_items oi
JOIN medicines m ON m.id = oi.medicine_id
JOIN orders o ON o.id = oi.order_id
WHERE o.payment_status = 'paid'
  AND o.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY m.id, m.name, m.category_id;

-- Create materialized view for user analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_analytics AS
SELECT 
  date_trunc('day', p.created_at)::date as date,
  COUNT(p.user_id) as new_users,
  COUNT(CASE WHEN o.id IS NOT NULL THEN p.user_id END) as users_with_orders,
  COUNT(CASE WHEN us.id IS NOT NULL THEN p.user_id END) as users_with_subscriptions
FROM profiles p
LEFT JOIN orders o ON o.user_id = p.user_id 
  AND o.payment_status = 'paid'
  AND o.created_at::date = p.created_at::date
LEFT JOIN user_subscriptions us ON us.user_id = p.user_id 
  AND us.status = 'active'
  AND us.created_at::date = p.created_at::date
WHERE p.created_at >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY date_trunc('day', p.created_at)::date;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_medicine_performance_revenue ON medicine_performance(total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date);

-- Grant permissions to admin/analyst users only
GRANT EXECUTE ON FUNCTION public.has_admin_access(uuid) TO authenticated;