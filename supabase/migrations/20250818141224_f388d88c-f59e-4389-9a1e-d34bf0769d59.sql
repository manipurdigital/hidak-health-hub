-- Add analyst role to enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'doctor', 'lab', 'user');
    END IF;
    
    -- Add analyst to existing enum
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'analyst';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Update the has_role function to be more flexible
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

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.daily_analytics;
  REFRESH MATERIALIZED VIEW public.medicine_performance;
  REFRESH MATERIALIZED VIEW public.user_analytics;
END;
$$;

-- Updated KPI function using materialized views
CREATE OR REPLACE FUNCTION public.admin_kpi_overview(start_date date, end_date date)
RETURNS TABLE(
  total_revenue numeric,
  total_orders bigint,
  avg_order_value numeric,
  new_users bigint,
  conversion_rate numeric,
  active_subscriptions bigint,
  prev_revenue numeric,
  prev_orders bigint,
  prev_aov numeric,
  prev_new_users bigint,
  revenue_growth numeric,
  order_growth numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_period AS (
    SELECT 
      COALESCE(SUM(da.total_revenue), 0) as revenue,
      COALESCE(SUM(da.total_orders), 0) as orders,
      CASE WHEN SUM(da.total_orders) > 0 
        THEN SUM(da.total_revenue) / SUM(da.total_orders) 
        ELSE 0 
      END as aov
    FROM daily_analytics da
    WHERE da.date >= start_date AND da.date <= end_date
  ),
  current_users AS (
    SELECT COALESCE(SUM(ua.new_users), 0) as new_users
    FROM user_analytics ua
    WHERE ua.date >= start_date AND ua.date <= end_date
  ),
  period_days AS (
    SELECT (end_date - start_date + 1)::integer as days
  ),
  prev_period AS (
    SELECT 
      COALESCE(SUM(da.total_revenue), 0) as prev_revenue,
      COALESCE(SUM(da.total_orders), 0) as prev_orders,
      CASE WHEN SUM(da.total_orders) > 0 
        THEN SUM(da.total_revenue) / SUM(da.total_orders) 
        ELSE 0 
      END as prev_aov
    FROM daily_analytics da, period_days pd
    WHERE da.date >= (start_date - pd.days) 
      AND da.date < start_date
  ),
  prev_users AS (
    SELECT COALESCE(SUM(ua.new_users), 0) as prev_new_users
    FROM user_analytics ua, period_days pd
    WHERE ua.date >= (start_date - pd.days)
      AND ua.date < start_date
  ),
  active_subs AS (
    SELECT COUNT(*) as count
    FROM user_subscriptions us
    WHERE us.status = 'active' 
      AND us.current_period_end >= CURRENT_DATE
  )
  SELECT 
    cp.revenue,
    cp.orders,
    cp.aov,
    cu.new_users,
    CASE WHEN cu.new_users > 0 
      THEN (cp.orders::numeric / cu.new_users) * 100 
      ELSE 0 
    END as conversion_rate,
    asubs.count as active_subscriptions,
    pp.prev_revenue,
    pp.prev_orders,
    pp.prev_aov,
    pu.prev_new_users,
    CASE WHEN pp.prev_revenue > 0 
      THEN ((cp.revenue - pp.prev_revenue) / pp.prev_revenue) * 100 
      ELSE 0 
    END as revenue_growth,
    CASE WHEN pp.prev_orders > 0 
      THEN ((cp.orders - pp.prev_orders)::numeric / pp.prev_orders) * 100 
      ELSE 0 
    END as order_growth
  FROM current_period cp, current_users cu, prev_period pp, prev_users pu, active_subs asubs;
$$;

-- Updated timeseries function using materialized views
CREATE OR REPLACE FUNCTION public.admin_timeseries_data(
  metric_type text,
  start_date date,
  end_date date
)
RETURNS TABLE(
  date text,
  value numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    da.date::text,
    CASE 
      WHEN metric_type = 'revenue' THEN da.total_revenue
      WHEN metric_type = 'orders' THEN da.total_orders::numeric
      WHEN metric_type = 'customers' THEN da.unique_customers::numeric
      WHEN metric_type = 'aov' THEN da.avg_order_value
      ELSE 0
    END as value
  FROM daily_analytics da
  WHERE da.date >= start_date AND da.date <= end_date
  ORDER BY da.date;
$$;

-- Top medicines function using materialized view
CREATE OR REPLACE FUNCTION public.admin_top_medicines(
  start_date date,
  end_date date,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  medicine_name text,
  total_revenue numeric,
  total_quantity bigint,
  order_count bigint,
  unique_customers bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mp.medicine_name,
    mp.total_revenue,
    mp.total_quantity,
    mp.order_count,
    mp.unique_customers
  FROM medicine_performance mp
  WHERE mp.last_ordered >= start_date::timestamp
  ORDER BY mp.total_revenue DESC
  LIMIT limit_count;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_medicine_performance_revenue ON medicine_performance(total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(date);

-- Grant permissions only to admin/analyst roles
GRANT EXECUTE ON FUNCTION public.has_admin_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_kpi_overview(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_timeseries_data(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_top_medicines(date, date, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views() TO authenticated;

-- Initial refresh of materialized views
SELECT public.refresh_analytics_views();