-- Fix security warnings by securing materialized views with RLS

-- Enable RLS on materialized views and restrict access
ALTER MATERIALIZED VIEW public.daily_analytics OWNER TO supabase_admin;
ALTER MATERIALIZED VIEW public.medicine_performance OWNER TO supabase_admin;
ALTER MATERIALIZED VIEW public.user_analytics OWNER TO supabase_admin;

-- Revoke public access to materialized views
REVOKE ALL ON public.daily_analytics FROM PUBLIC;
REVOKE ALL ON public.medicine_performance FROM PUBLIC;
REVOKE ALL ON public.user_analytics FROM PUBLIC;

-- Grant access only to service role
GRANT SELECT ON public.daily_analytics TO service_role;
GRANT SELECT ON public.medicine_performance TO service_role;
GRANT SELECT ON public.user_analytics TO service_role;

-- Create secure views that use the materialized views with proper access control
CREATE OR REPLACE VIEW public.secure_daily_analytics AS
SELECT * FROM public.daily_analytics
WHERE public.has_admin_access();

CREATE OR REPLACE VIEW public.secure_medicine_performance AS
SELECT * FROM public.medicine_performance
WHERE public.has_admin_access();

CREATE OR REPLACE VIEW public.secure_user_analytics AS
SELECT * FROM public.user_analytics
WHERE public.has_admin_access();

-- Enable RLS on the secure views
ALTER VIEW public.secure_daily_analytics OWNER TO supabase_admin;
ALTER VIEW public.secure_medicine_performance OWNER TO supabase_admin;
ALTER VIEW public.secure_user_analytics OWNER TO supabase_admin;

-- Grant controlled access to authenticated users for the secure views
GRANT SELECT ON public.secure_daily_analytics TO authenticated;
GRANT SELECT ON public.secure_medicine_performance TO authenticated;
GRANT SELECT ON public.secure_user_analytics TO authenticated;

-- Update the admin functions to use secure views instead of direct materialized view access
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT public.has_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin or analyst role required.';
  END IF;

  RETURN QUERY
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
END;
$$;

-- Update timeseries function with proper security
CREATE OR REPLACE FUNCTION public.admin_timeseries_data(
  metric_type text,
  start_date date,
  end_date date
)
RETURNS TABLE(
  date text,
  value numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT public.has_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin or analyst role required.';
  END IF;

  RETURN QUERY
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
END;
$$;

-- Update top medicines function with proper security
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT public.has_admin_access() THEN
    RAISE EXCEPTION 'Access denied. Admin or analyst role required.';
  END IF;

  RETURN QUERY
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
END;
$$;