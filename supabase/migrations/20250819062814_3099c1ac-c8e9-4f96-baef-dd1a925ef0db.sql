-- Add paid_at columns for better payment reconciliation
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

ALTER TABLE public.lab_bookings 
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at) WHERE paid_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_bookings_paid_at ON public.lab_bookings(paid_at) WHERE paid_at IS NOT NULL;

-- Create atomic payment processing function
CREATE OR REPLACE FUNCTION public.process_payment_captured(
  p_razorpay_order_id text,
  p_razorpay_payment_id text,
  p_amount numeric,
  p_currency text DEFAULT 'INR'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  update_timestamp timestamp with time zone := now();
BEGIN
  -- Update orders
  UPDATE orders SET
    payment_status = 'paid',
    razorpay_payment_id = p_razorpay_payment_id,
    status = 'confirmed',
    paid_at = update_timestamp,
    updated_at = update_timestamp
  WHERE razorpay_order_id = p_razorpay_order_id
    AND payment_status != 'paid'; -- Prevent double processing
  
  -- Update lab bookings  
  UPDATE lab_bookings SET
    payment_status = 'paid',
    razorpay_payment_id = p_razorpay_payment_id,
    status = 'confirmed',
    paid_at = update_timestamp,
    updated_at = update_timestamp
  WHERE razorpay_order_id = p_razorpay_order_id
    AND payment_status != 'paid'; -- Prevent double processing
END;
$$;

-- Create function to get payment summary for reconciliation
CREATE OR REPLACE FUNCTION public.get_payment_summary(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '7 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  date date,
  order_payments_count bigint,
  order_payments_amount numeric,
  lab_payments_count bigint,
  lab_payments_amount numeric,
  total_payments_count bigint,
  total_payments_amount numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH date_series AS (
    SELECT generate_series(start_date::date, end_date::date, INTERVAL '1 day')::date as date
  ),
  order_stats AS (
    SELECT 
      paid_at::date as payment_date,
      COUNT(*) as order_count,
      SUM(total_amount) as order_amount
    FROM orders
    WHERE paid_at >= start_date::timestamp
      AND paid_at <= (end_date + INTERVAL '1 day')::timestamp
      AND payment_status = 'paid'
    GROUP BY paid_at::date
  ),
  lab_stats AS (
    SELECT 
      paid_at::date as payment_date,
      COUNT(*) as lab_count,
      SUM(total_amount) as lab_amount
    FROM lab_bookings
    WHERE paid_at >= start_date::timestamp
      AND paid_at <= (end_date + INTERVAL '1 day')::timestamp
      AND payment_status = 'paid'
    GROUP BY paid_at::date
  )
  SELECT 
    ds.date,
    COALESCE(os.order_count, 0) as order_payments_count,
    COALESCE(os.order_amount, 0) as order_payments_amount,
    COALESCE(ls.lab_count, 0) as lab_payments_count,
    COALESCE(ls.lab_amount, 0) as lab_payments_amount,
    COALESCE(os.order_count, 0) + COALESCE(ls.lab_count, 0) as total_payments_count,
    COALESCE(os.order_amount, 0) + COALESCE(ls.lab_amount, 0) as total_payments_amount
  FROM date_series ds
  LEFT JOIN order_stats os ON ds.date = os.payment_date
  LEFT JOIN lab_stats ls ON ds.date = ls.payment_date
  ORDER BY ds.date;
$$;