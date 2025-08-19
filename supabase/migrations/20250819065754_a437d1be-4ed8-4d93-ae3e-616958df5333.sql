-- Create function to access medicine recommendations materialized view
CREATE OR REPLACE FUNCTION public.get_medicine_recommendations(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  brand text,
  price numeric,
  image_url text,
  category_id uuid,
  popularity_score bigint,
  order_count bigint,
  trend_status text,
  last_updated timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    mr.id,
    mr.name,
    mr.brand,
    mr.price,
    mr.image_url,
    mr.category_id,
    mr.popularity_score,
    mr.order_count,
    mr.trend_status,
    mr.last_updated
  FROM public.medicine_recommendations mr
  ORDER BY mr.popularity_score DESC, mr.last_updated DESC
  LIMIT limit_count;
$$;