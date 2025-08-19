-- Performance Hardening: Add critical database indexes for hot queries

-- 1. Search Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_search_gin 
ON public.medicines USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(generic_name, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_active_category 
ON public.medicines(is_active, category_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medicines_name_trgm 
ON public.medicines USING gin(name gin_trgm_ops);

-- 2. Orders Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created 
ON public.orders(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON public.orders(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status 
ON public.orders(payment_status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_medicine_created 
ON public.order_items(medicine_id, created_at DESC);

-- 3. Lab Bookings Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_bookings_center_date 
ON public.lab_bookings(center_id, booking_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_bookings_user_created 
ON public.lab_bookings(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lab_bookings_status_date 
ON public.lab_bookings(status, booking_date DESC);

-- 4. Consultations Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_doctor_date 
ON public.consultations(doctor_id, consultation_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_patient_created 
ON public.consultations(patient_id, created_at DESC);

-- 5. Geofencing Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geofences_active_service 
ON public.geofences(is_active, service_type) WHERE is_active = true;

-- 6. Cache Performance Table
CREATE TABLE IF NOT EXISTS public.query_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_query_cache_expires 
ON public.query_cache(expires_at);

-- Enable RLS on cache table
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

-- Cache is readable by everyone for public queries
CREATE POLICY "Cache is readable for valid queries"
ON public.query_cache
FOR SELECT
USING (expires_at > now());

-- System can manage cache
CREATE POLICY "System can manage cache"
ON public.query_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Materialized View for Medicine Recommendations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.medicine_recommendations AS
SELECT 
  m.id,
  m.name,
  m.brand,
  m.price,
  m.image_url,
  m.category_id,
  -- Popularity score based on recent orders
  COALESCE(order_stats.total_quantity, 0) as popularity_score,
  COALESCE(order_stats.order_count, 0) as order_count,
  -- Trending score (recent vs historical)
  CASE 
    WHEN COALESCE(order_stats.recent_quantity, 0) > COALESCE(order_stats.historical_avg, 0) * 1.5 
    THEN 'trending'
    ELSE 'stable'
  END as trend_status,
  now() as last_updated
FROM public.medicines m
LEFT JOIN (
  SELECT 
    oi.medicine_id,
    SUM(oi.quantity) as total_quantity,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(CASE WHEN o.created_at >= now() - INTERVAL '7 days' THEN oi.quantity ELSE 0 END) as recent_quantity,
    AVG(CASE WHEN o.created_at < now() - INTERVAL '7 days' THEN oi.quantity ELSE NULL END) as historical_avg
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.payment_status = 'paid' 
    AND o.created_at >= now() - INTERVAL '90 days'
  GROUP BY oi.medicine_id
) order_stats ON order_stats.medicine_id = m.id
WHERE m.is_active = true
ORDER BY 
  COALESCE(order_stats.total_quantity, 0) DESC,
  m.created_at DESC;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_medicine_recommendations_popularity 
ON public.medicine_recommendations(popularity_score DESC, trend_status);

CREATE INDEX IF NOT EXISTS idx_medicine_recommendations_category 
ON public.medicine_recommendations(category_id, popularity_score DESC);

-- 8. Performance Monitoring Table
CREATE TABLE IF NOT EXISTS public.performance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  status_code INTEGER,
  user_id UUID,
  request_id TEXT,
  query_count INTEGER DEFAULT 0,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_logs_endpoint_created 
ON public.performance_logs(endpoint, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_logs_duration 
ON public.performance_logs(duration_ms DESC, created_at DESC);

-- Enable RLS
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all performance logs
CREATE POLICY "Admins can view performance logs"
ON public.performance_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert performance logs
CREATE POLICY "System can insert performance logs"
ON public.performance_logs
FOR INSERT
WITH CHECK (true);

-- Function to refresh recommendations view
CREATE OR REPLACE FUNCTION public.refresh_medicine_recommendations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.medicine_recommendations;
END;
$$;

-- Function to clean old cache entries
CREATE OR REPLACE FUNCTION public.cleanup_query_cache()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH deleted AS (
    DELETE FROM public.query_cache 
    WHERE expires_at <= now()
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM deleted;
$$;