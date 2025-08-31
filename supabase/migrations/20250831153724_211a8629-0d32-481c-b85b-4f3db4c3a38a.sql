-- Create missing stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Anyone can view active stores" 
ON public.stores 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage stores" 
ON public.stores 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);

-- Add updated_at trigger
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create missing analytics functions as placeholders
CREATE OR REPLACE FUNCTION public.admin_kpi_overview(start_date text, end_date text)
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
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation
  RETURN QUERY SELECT 
    0::numeric as total_revenue,
    0::bigint as total_orders,
    0::numeric as avg_order_value,
    0::bigint as new_users,
    0::numeric as conversion_rate,
    0::bigint as active_subscriptions,
    0::numeric as prev_revenue,
    0::bigint as prev_orders,
    0::numeric as prev_aov,
    0::bigint as prev_new_users,
    0::numeric as revenue_growth,
    0::numeric as order_growth;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_timeseries_data(metric_type text, start_date text, end_date text)
RETURNS TABLE(date text, value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation
  RETURN QUERY SELECT 
    start_date::text as date,
    0::numeric as value;
END;
$$;

CREATE OR REPLACE FUNCTION public.revenue_breakdown(breakdown_by text, start_ts text, end_ts string)
RETURNS TABLE(category text, revenue numeric, orders bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation
  RETURN QUERY SELECT 
    'placeholder'::text as category,
    0::numeric as revenue,
    0::bigint as orders;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_medicines(start_date text, end_date text, limit_count integer)
RETURNS TABLE(
  medicine_name text,
  total_revenue numeric,
  total_quantity bigint,
  order_count bigint,
  unique_customers bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder implementation
  RETURN QUERY SELECT 
    'placeholder'::text as medicine_name,
    0::numeric as total_revenue,
    0::bigint as total_quantity,
    0::bigint as order_count,
    0::bigint as unique_customers;
END;
$$;