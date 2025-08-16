-- Add missing columns to orders table for Razorpay integration
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Add missing columns to lab_bookings table for Razorpay integration  
ALTER TABLE public.lab_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.lab_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- Create indexes for faster webhook processing
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_razorpay_order_id ON public.lab_bookings(razorpay_order_id);

-- Add order tracking statuses
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'pending';
-- Status flow: pending -> confirmed -> packed -> shipped -> delivered