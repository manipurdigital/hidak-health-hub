-- Performance Hardening: Core tables and basic indexes

-- 1. Query Cache Table
CREATE TABLE IF NOT EXISTS public.query_cache (
  cache_key TEXT PRIMARY KEY,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
ON public.query_cache(expires_at);

-- Enable RLS on cache table
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cache is readable for valid queries"
ON public.query_cache
FOR SELECT
USING (expires_at > now());

CREATE POLICY "System can manage cache"
ON public.query_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Performance Monitoring Table
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

CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint_created 
ON public.performance_logs(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_logs_duration 
ON public.performance_logs(duration_ms DESC, created_at DESC);

-- Enable RLS
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view performance logs"
ON public.performance_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert performance logs"
ON public.performance_logs
FOR INSERT
WITH CHECK (true);

-- 3. Basic performance indexes for hot queries
CREATE INDEX IF NOT EXISTS idx_orders_user_created 
ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_bookings_center_date 
ON public.lab_bookings(center_id, booking_date DESC);

CREATE INDEX IF NOT EXISTS idx_lab_bookings_user_created 
ON public.lab_bookings(user_id, created_at DESC);

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