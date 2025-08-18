-- Create demand cache table for storing pre-computed recommendations
CREATE TABLE public.demand_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  city TEXT,
  pincode TEXT,
  hour_of_day INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 hours')
);

-- Create index for efficient lookups
CREATE INDEX idx_demand_cache_key ON public.demand_cache (cache_key);
CREATE INDEX idx_demand_cache_location ON public.demand_cache (city, pincode);
CREATE INDEX idx_demand_cache_expires ON public.demand_cache (expires_at);

-- Enable RLS
ALTER TABLE public.demand_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since recommendations are not sensitive)
CREATE POLICY "Cache is readable by everyone" 
ON public.demand_cache 
FOR SELECT 
USING (expires_at > now());

-- Create policy for system to manage cache
CREATE POLICY "System can manage cache" 
ON public.demand_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM public.demand_cache 
    WHERE expires_at <= now()
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM deleted;
$$;

-- Function to get cached recommendations
CREATE OR REPLACE FUNCTION public.get_cached_recommendations(
  at_ts TIMESTAMP WITH TIME ZONE,
  in_city TEXT DEFAULT NULL,
  in_pincode TEXT DEFAULT NULL,
  top_n INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT recommendations
  FROM public.demand_cache
  WHERE cache_key = CONCAT(
    'recommendations:',
    COALESCE(in_city, 'null'), ':',
    COALESCE(in_pincode, 'null'), ':',
    EXTRACT(hour FROM at_ts)::INTEGER, ':',
    EXTRACT(dow FROM at_ts)::INTEGER, ':',
    top_n
  )
  AND expires_at > now()
  LIMIT 1;
$$;

-- Function to set cached recommendations
CREATE OR REPLACE FUNCTION public.set_cached_recommendations(
  at_ts TIMESTAMP WITH TIME ZONE,
  in_city TEXT DEFAULT NULL,
  in_pincode TEXT DEFAULT NULL,
  top_n INTEGER DEFAULT 10,
  recommendations_data JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.demand_cache (
    cache_key,
    city,
    pincode,
    hour_of_day,
    day_of_week,
    recommendations,
    expires_at
  )
  VALUES (
    CONCAT(
      'recommendations:',
      COALESCE(in_city, 'null'), ':',
      COALESCE(in_pincode, 'null'), ':',
      EXTRACT(hour FROM at_ts)::INTEGER, ':',
      EXTRACT(dow FROM at_ts)::INTEGER, ':',
      top_n
    ),
    in_city,
    in_pincode,
    EXTRACT(hour FROM at_ts)::INTEGER,
    EXTRACT(dow FROM at_ts)::INTEGER,
    recommendations_data,
    now() + INTERVAL '2 hours'
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    recommendations = EXCLUDED.recommendations,
    created_at = now(),
    expires_at = now() + INTERVAL '2 hours';
$$;

GRANT EXECUTE ON FUNCTION public.clean_expired_cache() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cached_recommendations(timestamp with time zone, text, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_cached_recommendations(timestamp with time zone, text, text, integer, jsonb) TO anon, authenticated;