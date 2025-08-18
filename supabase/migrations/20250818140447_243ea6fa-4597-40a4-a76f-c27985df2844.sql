-- Fixed analytics functions for the dashboard

-- KPI Overview function
CREATE OR REPLACE FUNCTION public.kpi_overview(start_ts timestamptz, end_ts timestamptz)
RETURNS TABLE(
  total_revenue numeric,
  total_orders bigint,
  avg_order_value numeric,
  new_users bigint,
  conversion_rate numeric,
  active_subscriptions bigint,
  refund_rate numeric,
  prev_revenue numeric,
  prev_orders bigint,
  prev_aov numeric,
  prev_new_users bigint,
  prev_conversion_rate numeric,
  prev_active_subs bigint,
  prev_refund_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_period AS (
    SELECT 
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COUNT(o.id) as orders,
      CASE WHEN COUNT(o.id) > 0 THEN SUM(o.total_amount) / COUNT(o.id) ELSE 0 END as aov
    FROM orders o
    WHERE o.created_at >= start_ts AND o.created_at <= end_ts
      AND o.payment_status = 'paid'
  ),
  current_users AS (
    SELECT COUNT(DISTINCT p.user_id) as new_users
    FROM profiles p
    WHERE p.created_at >= start_ts AND p.created_at <= end_ts
  ),
  current_subs AS (
    SELECT COUNT(*) as active_subs
    FROM user_subscriptions us
    WHERE us.status = 'active' AND us.current_period_end >= CURRENT_DATE
  ),
  period_length AS (
    SELECT EXTRACT(EPOCH FROM (end_ts - start_ts)) as seconds
  ),
  prev_period AS (
    SELECT 
      COALESCE(SUM(o.total_amount), 0) as prev_revenue,
      COUNT(o.id) as prev_orders,
      CASE WHEN COUNT(o.id) > 0 THEN SUM(o.total_amount) / COUNT(o.id) ELSE 0 END as prev_aov
    FROM orders o, period_length pl
    WHERE o.created_at >= (start_ts - INTERVAL '1 second' * pl.seconds) 
      AND o.created_at < start_ts
      AND o.payment_status = 'paid'
  ),
  prev_users AS (
    SELECT COUNT(DISTINCT p.user_id) as prev_new_users
    FROM profiles p, period_length pl
    WHERE p.created_at >= (start_ts - INTERVAL '1 second' * pl.seconds)
      AND p.created_at < start_ts
  )
  SELECT 
    cp.revenue,
    cp.orders,
    cp.aov,
    cu.new_users,
    0::numeric as conversion_rate,
    cs.active_subs,
    0::numeric as refund_rate,
    pp.prev_revenue,
    pp.prev_orders,
    pp.prev_aov,
    pu.prev_new_users,
    0::numeric as prev_conversion_rate,
    cs.active_subs as prev_active_subs,
    0::numeric as prev_refund_rate
  FROM current_period cp, current_users cu, current_subs cs, prev_period pp, prev_users pu;
$$;

-- Simplified timeseries function
CREATE OR REPLACE FUNCTION public.timeseries_metric(
  metric_name text, 
  granularity text, 
  start_ts timestamptz, 
  end_ts timestamptz
)
RETURNS TABLE(
  time_bucket text,
  value numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    to_char(
      CASE 
        WHEN granularity = 'day' THEN date_trunc('day', o.created_at)
        WHEN granularity = 'week' THEN date_trunc('week', o.created_at)
        WHEN granularity = 'month' THEN date_trunc('month', o.created_at)
        ELSE date_trunc('hour', o.created_at)
      END, 
      'YYYY-MM-DD'
    ) as time_bucket,
    CASE 
      WHEN metric_name = 'revenue' THEN SUM(o.total_amount)
      WHEN metric_name = 'orders' THEN COUNT(o.id)::numeric
      ELSE 0
    END as value
  FROM orders o
  WHERE o.created_at >= start_ts AND o.created_at <= end_ts
    AND o.payment_status = 'paid'
  GROUP BY 1
  ORDER BY 1;
$$;

-- Revenue breakdown function
CREATE OR REPLACE FUNCTION public.revenue_breakdown(
  breakdown_by text,
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS TABLE(
  category text,
  revenue numeric,
  orders bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN breakdown_by = 'payment_method' THEN COALESCE(o.payment_method, 'Unknown')
      WHEN breakdown_by = 'status' THEN COALESCE(o.status, 'Unknown')
      ELSE 'Other'
    END as category,
    SUM(o.total_amount) as revenue,
    COUNT(o.id) as orders
  FROM orders o
  WHERE o.created_at >= start_ts AND o.created_at <= end_ts
    AND o.payment_status = 'paid'
  GROUP BY 1
  ORDER BY revenue DESC;
$$;

-- Top medicines function
CREATE OR REPLACE FUNCTION public.top_medicines_by_revenue(
  start_ts timestamptz,
  end_ts timestamptz,
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  medicine_name text,
  total_revenue numeric,
  total_quantity bigint,
  order_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    m.name as medicine_name,
    SUM(oi.total_price) as total_revenue,
    SUM(oi.quantity) as total_quantity,
    COUNT(DISTINCT oi.order_id) as order_count
  FROM order_items oi
  JOIN medicines m ON m.id = oi.medicine_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= start_ts AND o.created_at <= end_ts
    AND o.payment_status = 'paid'
  GROUP BY m.id, m.name
  ORDER BY total_revenue DESC
  LIMIT limit_count;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.kpi_overview(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timeseries_metric(text, text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_breakdown(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_medicines_by_revenue(timestamptz, timestamptz, integer) TO authenticated;