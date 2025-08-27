
-- 1) Add Razorpay tracking fields to consultations for prepaid-only confirmation
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2) Index for quick lookups when processing webhooks
CREATE INDEX IF NOT EXISTS idx_consultations_razorpay_order_id
  ON public.consultations(razorpay_order_id);
