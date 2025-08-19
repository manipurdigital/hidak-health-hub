-- Create payment_events table for webhook idempotency and audit trail
CREATE TABLE public.payment_events (
  id text PRIMARY KEY, -- Razorpay event ID for idempotency
  payload jsonb NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  signature_valid boolean NOT NULL DEFAULT false,
  outcome text, -- 'success', 'failed', 'ignored', 'error'
  error_details jsonb,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text,
  entity_type text,
  entity_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payment_events
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_events
CREATE POLICY "Admins can view all payment events" 
ON public.payment_events 
FOR SELECT 
USING (has_admin_access(auth.uid()));

CREATE POLICY "System can insert payment events" 
ON public.payment_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update payment events" 
ON public.payment_events 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_payment_events_received_at ON public.payment_events(received_at DESC);
CREATE INDEX idx_payment_events_processed_at ON public.payment_events(processed_at DESC) WHERE processed_at IS NOT NULL;
CREATE INDEX idx_payment_events_outcome ON public.payment_events(outcome);
CREATE INDEX idx_payment_events_entity ON public.payment_events(entity_type, entity_id);
CREATE INDEX idx_payment_events_correlation_id ON public.payment_events(correlation_id);

-- Create function for payment reconciliation stats
CREATE OR REPLACE FUNCTION public.get_payment_reconciliation_stats(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_events bigint,
  processed_events bigint,
  failed_events bigint,
  pending_events bigint,
  duplicate_events bigint,
  success_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN outcome = 'success' THEN 1 END) as success_count,
      COUNT(CASE WHEN outcome = 'failed' OR outcome = 'error' THEN 1 END) as failed_count,
      COUNT(CASE WHEN processed_at IS NULL THEN 1 END) as pending_count,
      COUNT(CASE WHEN outcome = 'ignored' THEN 1 END) as duplicate_count
    FROM payment_events 
    WHERE received_at >= start_date::timestamp 
      AND received_at <= (end_date + INTERVAL '1 day')::timestamp
  )
  SELECT 
    total,
    (success_count + duplicate_count) as processed,
    failed_count as failed,
    pending_count as pending,
    duplicate_count as duplicates,
    CASE 
      WHEN total > 0 THEN ROUND((success_count::numeric / total::numeric) * 100, 2)
      ELSE 0 
    END as success_rate
  FROM stats;
$$;