
-- 1) Orders: add Razorpay linkage + payment timestamp
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id);

-- 2) Lab bookings: same linkage fields for webhook consistency
ALTER TABLE public.lab_bookings
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lab_bookings_razorpay_order_id
  ON public.lab_bookings (razorpay_order_id);

-- 3) Consultations: same linkage fields for webhook consistency
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_consultations_razorpay_order_id
  ON public.consultations (razorpay_order_id);

-- 4) Payment events table used by the Razorpay webhook for idempotency/auditing
CREATE TABLE IF NOT EXISTS public.payment_events (
  id text PRIMARY KEY,
  event_type text,
  entity_type text,
  entity_id text,
  payload jsonb NOT NULL,
  signature_valid boolean DEFAULT false,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  correlation_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS and allow only admins to view events (edge functions use service role and bypass RLS)
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'payment_events' 
      AND policyname = 'Admins can view payment events'
  ) THEN
    CREATE POLICY "Admins can view payment events"
      ON public.payment_events
      FOR SELECT
      USING (get_current_user_role() = 'admin'::app_role);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_payment_events_processed
  ON public.payment_events (processed);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
  ON public.payment_events (created_at);
