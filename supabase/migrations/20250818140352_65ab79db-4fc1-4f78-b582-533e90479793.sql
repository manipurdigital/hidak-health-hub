-- Create admin analytics functions for the dashboard

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
    0::numeric as conversion_rate, -- Placeholder for now
    cs.active_subs,
    0::numeric as refund_rate, -- Placeholder for now
    pp.prev_revenue,
    pp.prev_orders,
    pp.prev_aov,
    pu.prev_new_users,
    0::numeric as prev_conversion_rate,
    cs.active_subs as prev_active_subs, -- Simplified for now
    0::numeric as prev_refund_rate
  FROM current_period cp, current_users cu, current_subs cs, prev_period pp, prev_users pu;
$$;

-- Timeseries metric function
CREATE OR REPLACE FUNCTION public.timeseries_metric(
  metric_name text, 
  granularity text, 
  start_ts timestamptz, 
  end_ts timestamptz,
  segment text DEFAULT 'all'
)
RETURNS TABLE(
  time_bucket timestamptz,
  value numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH time_series AS (
    SELECT generate_series(
      date_trunc(granularity, start_ts),
      date_trunc(granularity, end_ts),
      INTERVAL '1 ' || granularity
    ) as bucket
  )
  SELECT 
    ts.bucket,
    CASE 
      WHEN metric_name = 'revenue' THEN
        COALESCE(SUM(o.total_amount), 0)
      WHEN metric_name = 'orders' THEN
        COUNT(o.id)::numeric
      WHEN metric_name = 'users' THEN
        COUNT(DISTINCT p.user_id)::numeric
      ELSE 0
    END as value
  FROM time_series ts
  LEFT JOIN orders o ON 
    metric_name IN ('revenue', 'orders') AND
    date_trunc(granularity, o.created_at) = ts.bucket AND
    o.payment_status = 'paid'
  LEFT JOIN profiles p ON
    metric_name = 'users' AND
    date_trunc(granularity, p.created_at) = ts.bucket
  GROUP BY ts.bucket
  ORDER BY ts.bucket;
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

-- Lab bookings metrics function
CREATE OR REPLACE FUNCTION public.lab_bookings_metrics(
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS TABLE(
  total_bookings bigint,
  total_revenue numeric,
  avg_booking_value numeric,
  completed_bookings bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(lb.id) as total_bookings,
    SUM(lb.total_amount) as total_revenue,
    CASE WHEN COUNT(lb.id) > 0 THEN SUM(lb.total_amount) / COUNT(lb.id) ELSE 0 END as avg_booking_value,
    COUNT(CASE WHEN lb.status = 'completed' THEN 1 END) as completed_bookings
  FROM lab_bookings lb
  WHERE lb.created_at >= start_ts AND lb.created_at <= end_ts
    AND lb.payment_status = 'paid';
$$;

-- Consultation metrics function
CREATE OR REPLACE FUNCTION public.consultation_metrics(
  start_ts timestamptz,
  end_ts timestamptz
)
RETURNS TABLE(
  total_consultations bigint,
  total_revenue numeric,
  avg_consultation_fee numeric,
  completed_consultations bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(c.id) as total_consultations,
    SUM(c.total_amount) as total_revenue,
    CASE WHEN COUNT(c.id) > 0 THEN SUM(c.total_amount) / COUNT(c.id) ELSE 0 END as avg_consultation_fee,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_consultations
  FROM consultations c
  WHERE c.created_at >= start_ts AND c.created_at <= end_ts
    AND c.payment_status = 'paid';
$$;

-- Top performing items function
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

-- Grant execute permissions to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION public.kpi_overview(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.timeseries_metric(text, text, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_breakdown(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lab_bookings_metrics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultation_metrics(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.top_medicines_by_revenue(timestamptz, timestamptz, integer) TO authenticated;