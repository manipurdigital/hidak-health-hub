-- Create functions for lab collections analytics
CREATE OR REPLACE FUNCTION public.lab_collections_kpis(
  start_date DATE,
  end_date DATE,
  center_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  pincode_filter TEXT DEFAULT NULL,
  test_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  total_bookings BIGINT,
  collected_bookings BIGINT,
  collection_rate NUMERIC,
  lab_revenue NUMERIC,
  center_payouts NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered_bookings AS (
    SELECT 
      lb.*,
      lt.name as test_name,
      lt.price as test_price
    FROM lab_bookings lb
    JOIN lab_tests lt ON lb.test_id = lt.id
    WHERE lb.booking_date >= start_date 
      AND lb.booking_date <= end_date
      AND (center_filter IS NULL OR lb.collector_name ILIKE '%' || center_filter || '%')
      AND (city_filter IS NULL OR lb.patient_name ILIKE '%' || city_filter || '%') -- temporary mapping
      AND (pincode_filter IS NULL OR lb.patient_phone ILIKE '%' || pincode_filter || '%') -- temporary mapping
      AND (test_filter IS NULL OR lb.test_id = test_filter)
  )
  SELECT 
    COUNT(*)::BIGINT as total_bookings,
    COUNT(CASE WHEN status = 'collected' THEN 1 END)::BIGINT as collected_bookings,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN status = 'collected' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END as collection_rate,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount ELSE 0 END), 0) as lab_revenue,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount * 0.3 ELSE 0 END), 0) as center_payouts -- 30% to centers
  FROM filtered_bookings;
$$;

-- Lab collections by day
CREATE OR REPLACE FUNCTION public.lab_collections_by_day(
  start_date DATE,
  end_date DATE,
  center_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  pincode_filter TEXT DEFAULT NULL,
  test_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  collection_date DATE,
  bookings BIGINT,
  collected BIGINT,
  revenue NUMERIC,
  payouts NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered_bookings AS (
    SELECT 
      lb.*,
      lt.name as test_name,
      lt.price as test_price
    FROM lab_bookings lb
    JOIN lab_tests lt ON lb.test_id = lt.id
    WHERE lb.booking_date >= start_date 
      AND lb.booking_date <= end_date
      AND (center_filter IS NULL OR lb.collector_name ILIKE '%' || center_filter || '%')
      AND (city_filter IS NULL OR lb.patient_name ILIKE '%' || city_filter || '%')
      AND (pincode_filter IS NULL OR lb.patient_phone ILIKE '%' || pincode_filter || '%')
      AND (test_filter IS NULL OR lb.test_id = test_filter)
  )
  SELECT 
    fb.booking_date as collection_date,
    COUNT(*)::BIGINT as bookings,
    COUNT(CASE WHEN status = 'collected' THEN 1 END)::BIGINT as collected,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount * 0.3 ELSE 0 END), 0) as payouts
  FROM filtered_bookings fb
  GROUP BY fb.booking_date
  ORDER BY fb.booking_date;
$$;

-- Lab collections by center
CREATE OR REPLACE FUNCTION public.lab_collections_by_center(
  start_date DATE,
  end_date DATE,
  center_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  pincode_filter TEXT DEFAULT NULL,
  test_filter UUID DEFAULT NULL
)
RETURNS TABLE(
  center_name TEXT,
  bookings BIGINT,
  collected BIGINT,
  revenue NUMERIC,
  payouts NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered_bookings AS (
    SELECT 
      lb.*,
      lt.name as test_name,
      lt.price as test_price,
      COALESCE(lb.collector_name, 'Unassigned') as center
    FROM lab_bookings lb
    JOIN lab_tests lt ON lb.test_id = lt.id
    WHERE lb.booking_date >= start_date 
      AND lb.booking_date <= end_date
      AND (center_filter IS NULL OR lb.collector_name ILIKE '%' || center_filter || '%')
      AND (city_filter IS NULL OR lb.patient_name ILIKE '%' || city_filter || '%')
      AND (pincode_filter IS NULL OR lb.patient_phone ILIKE '%' || pincode_filter || '%')
      AND (test_filter IS NULL OR lb.test_id = test_filter)
  )
  SELECT 
    fb.center as center_name,
    COUNT(*)::BIGINT as bookings,
    COUNT(CASE WHEN status = 'collected' THEN 1 END)::BIGINT as collected,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount ELSE 0 END), 0) as revenue,
    COALESCE(SUM(CASE WHEN status = 'collected' THEN total_amount * 0.3 ELSE 0 END), 0) as payouts
  FROM filtered_bookings fb
  GROUP BY fb.center
  ORDER BY revenue DESC;
$$;

-- Medicine sales KPIs
CREATE OR REPLACE FUNCTION public.medicine_sales_kpis(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  gmv NUMERIC,
  total_orders BIGINT,
  aov NUMERIC,
  prepaid_orders BIGINT,
  cod_orders BIGINT,
  prepaid_gmv NUMERIC,
  cod_gmv NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered_orders AS (
    SELECT 
      o.*,
      CASE WHEN o.payment_method = 'razorpay' THEN 'prepaid' ELSE 'cod' END as payment_type
    FROM orders o
    WHERE o.created_at::DATE >= start_date 
      AND o.created_at::DATE <= end_date
      AND o.payment_status = 'paid'
  )
  SELECT 
    COALESCE(SUM(total_amount), 0) as gmv,
    COUNT(*)::BIGINT as total_orders,
    CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(total_amount) / COUNT(*), 2) ELSE 0 END as aov,
    COUNT(CASE WHEN payment_type = 'prepaid' THEN 1 END)::BIGINT as prepaid_orders,
    COUNT(CASE WHEN payment_type = 'cod' THEN 1 END)::BIGINT as cod_orders,
    COALESCE(SUM(CASE WHEN payment_type = 'prepaid' THEN total_amount ELSE 0 END), 0) as prepaid_gmv,
    COALESCE(SUM(CASE WHEN payment_type = 'cod' THEN total_amount ELSE 0 END), 0) as cod_gmv
  FROM filtered_orders;
$$;

-- Medicine sales by day
CREATE OR REPLACE FUNCTION public.medicine_sales_by_day(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  sale_date DATE,
  orders BIGINT,
  revenue NUMERIC,
  aov NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    o.created_at::DATE as sale_date,
    COUNT(*)::BIGINT as orders,
    COALESCE(SUM(total_amount), 0) as revenue,
    CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(total_amount) / COUNT(*), 2) ELSE 0 END as aov
  FROM orders o
  WHERE o.created_at::DATE >= start_date 
    AND o.created_at::DATE <= end_date
    AND o.payment_status = 'paid'
  GROUP BY o.created_at::DATE
  ORDER BY o.created_at::DATE;
$$;

-- Top medicines by revenue
CREATE OR REPLACE FUNCTION public.top_medicines_by_revenue_detailed(
  start_date DATE,
  end_date DATE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  medicine_name TEXT,
  total_revenue NUMERIC,
  units_sold BIGINT,
  orders_count BIGINT,
  avg_price NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    m.name as medicine_name,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0)::BIGINT as units_sold,
    COUNT(DISTINCT oi.order_id)::BIGINT as orders_count,
    CASE WHEN SUM(oi.quantity) > 0 THEN ROUND(SUM(oi.total_price) / SUM(oi.quantity), 2) ELSE 0 END as avg_price
  FROM order_items oi
  JOIN medicines m ON m.id = oi.medicine_id
  JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at::DATE >= start_date 
    AND o.created_at::DATE <= end_date
    AND o.payment_status = 'paid'
  GROUP BY m.id, m.name
  ORDER BY total_revenue DESC
  LIMIT limit_count;
$$;

-- Doctor consultations KPIs
CREATE OR REPLACE FUNCTION public.consultation_kpis(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  total_consultations BIGINT,
  completed_consultations BIGINT,
  completion_rate NUMERIC,
  consultation_revenue NUMERIC,
  care_plus_consultations BIGINT,
  care_plus_share NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH filtered_consultations AS (
    SELECT 
      c.*,
      CASE WHEN us.id IS NOT NULL THEN true ELSE false END as is_care_plus
    FROM consultations c
    LEFT JOIN user_subscriptions us ON c.patient_id = us.user_id 
      AND us.status = 'active' 
      AND c.consultation_date >= us.current_period_start
      AND c.consultation_date <= us.current_period_end
    WHERE c.consultation_date >= start_date 
      AND c.consultation_date <= end_date
  )
  SELECT 
    COUNT(*)::BIGINT as total_consultations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT as completed_consultations,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END as completion_rate,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as consultation_revenue,
    COUNT(CASE WHEN is_care_plus THEN 1 END)::BIGINT as care_plus_consultations,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(CASE WHEN is_care_plus THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END as care_plus_share
  FROM filtered_consultations;
$$;

-- Consultations by day
CREATE OR REPLACE FUNCTION public.consultations_by_day(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  consultation_date DATE,
  consultations BIGINT,
  completed BIGINT,
  revenue NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.consultation_date,
    COUNT(*)::BIGINT as consultations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT as completed,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue
  FROM consultations c
  WHERE c.consultation_date >= start_date 
    AND c.consultation_date <= end_date
  GROUP BY c.consultation_date
  ORDER BY c.consultation_date;
$$;

-- Consultations by specialty
CREATE OR REPLACE FUNCTION public.consultations_by_specialty(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  specialization TEXT,
  consultations BIGINT,
  completed BIGINT,
  revenue NUMERIC,
  avg_fee NUMERIC
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    d.specialization,
    COUNT(c.id)::BIGINT as consultations,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END)::BIGINT as completed,
    COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.total_amount ELSE 0 END), 0) as revenue,
    CASE WHEN COUNT(c.id) > 0 THEN ROUND(AVG(c.total_amount), 2) ELSE 0 END as avg_fee
  FROM consultations c
  JOIN doctors d ON c.doctor_id = d.id
  WHERE c.consultation_date >= start_date 
    AND c.consultation_date <= end_date
  GROUP BY d.specialization
  ORDER BY revenue DESC;
$$;