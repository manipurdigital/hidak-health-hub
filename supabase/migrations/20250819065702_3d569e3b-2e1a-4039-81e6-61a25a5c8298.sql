-- Create cron jobs for performance optimization

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cache cleanup every 15 minutes
SELECT cron.schedule(
  'cleanup-query-cache',
  '*/15 * * * *',
  $$SELECT public.cleanup_query_cache();$$
);

-- Create materialized view for medicine recommendations
CREATE MATERIALIZED VIEW IF NOT EXISTS public.medicine_recommendations AS
SELECT 
  m.id,
  m.name,
  m.brand,
  m.price,
  m.image_url,
  m.category_id,
  COALESCE(order_stats.total_quantity, 0) as popularity_score,
  COALESCE(order_stats.order_count, 0) as order_count,
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

-- Function to refresh recommendations
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

-- Schedule materialized view refresh every 15 minutes
SELECT cron.schedule(
  'refresh-medicine-recommendations',
  '*/15 * * * *',
  $$SELECT public.refresh_medicine_recommendations();$$
);