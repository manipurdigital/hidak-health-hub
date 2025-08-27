
-- 1) Add per-center commission rate
ALTER TABLE public.diagnostic_centers
  ADD COLUMN IF NOT EXISTS platform_commission_rate numeric NOT NULL DEFAULT 0.20;

-- Range check (immutable; safe to use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'diagnostic_centers_platform_commission_rate_range'
  ) THEN
    ALTER TABLE public.diagnostic_centers
      ADD CONSTRAINT diagnostic_centers_platform_commission_rate_range
        CHECK (platform_commission_rate >= 0 AND platform_commission_rate <= 1);
  END IF;
END$$;

-- 2) Extend lab_bookings with payment method and split fields
ALTER TABLE public.lab_bookings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS platform_commission_rate numeric,
  ADD COLUMN IF NOT EXISTS platform_commission_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partner_amount numeric DEFAULT 0;

-- Limit payment_method to allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'lab_bookings_payment_method_check'
  ) THEN
    ALTER TABLE public.lab_bookings
      ADD CONSTRAINT lab_bookings_payment_method_check
        CHECK (payment_method IN ('online','cod'));
  END IF;
END$$;

-- 3) Trigger to compute booking financials
CREATE OR REPLACE FUNCTION public.compute_lab_booking_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_commission numeric;
  v_center_share numeric;
BEGIN
  -- Commission lookup: if center is present, use center rate; else default 0.20
  IF NEW.center_id IS NOT NULL THEN
    SELECT dc.platform_commission_rate
      INTO v_commission
    FROM public.diagnostic_centers dc
    WHERE dc.id = NEW.center_id;
  END IF;

  IF v_commission IS NULL THEN
    v_commission := 0.20; -- default if no center or missing value
  END IF;

  -- Normalize and compute shares
  IF v_commission < 0 THEN v_commission := 0; END IF;
  IF v_commission > 1 THEN v_commission := 1; END IF;

  v_center_share := 1 - v_commission;

  -- Snapshot the rates on the booking
  NEW.platform_commission_rate := v_commission;
  NEW.center_payout_rate := v_center_share;

  -- Safe guards if total_amount is null
  IF NEW.total_amount IS NULL THEN
    NEW.total_amount := 0;
  END IF;

  NEW.platform_commission_amount := ROUND(NEW.total_amount * v_commission, 2);
  NEW.partner_amount := ROUND(NEW.total_amount * v_center_share, 2);

  -- Partner payout is only due when WE collected (online) and payment is paid
  IF NEW.payment_method = 'online' AND NEW.payment_status = 'paid' THEN
    NEW.center_payout_amount := NEW.partner_amount;
  ELSE
    NEW.center_payout_amount := 0;
  END IF;

  RETURN NEW;
END;
$$;

-- Create/update trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_compute_lab_booking_financials'
  ) THEN
    DROP TRIGGER trg_compute_lab_booking_financials ON public.lab_bookings;
  END IF;
END$$;

CREATE TRIGGER trg_compute_lab_booking_financials
BEFORE INSERT OR UPDATE OF center_id, total_amount, payment_method, payment_status
ON public.lab_bookings
FOR EACH ROW
EXECUTE FUNCTION public.compute_lab_booking_financials();

-- 4) Backfill existing rows (idempotent)
UPDATE public.lab_bookings lb
SET payment_method = COALESCE(lb.payment_method, 'online');

UPDATE public.lab_bookings lb
SET platform_commission_rate = COALESCE(dc.platform_commission_rate, 0.20),
    center_payout_rate       = 1 - COALESCE(dc.platform_commission_rate, 0.20),
    platform_commission_amount = ROUND(COALESCE(lb.total_amount,0) * COALESCE(dc.platform_commission_rate, 0.20), 2),
    partner_amount             = ROUND(COALESCE(lb.total_amount,0) * (1 - COALESCE(dc.platform_commission_rate, 0.20)), 2),
    center_payout_amount       = CASE 
                                   WHEN lb.payment_method = 'online' AND lb.payment_status = 'paid'
                                     THEN ROUND(COALESCE(lb.total_amount,0) * (1 - COALESCE(dc.platform_commission_rate, 0.20)), 2)
                                   ELSE 0
                                 END
FROM public.diagnostic_centers dc
WHERE lb.center_id = dc.id
  AND (
    lb.platform_commission_rate IS DISTINCT FROM dc.platform_commission_rate
    OR lb.partner_amount IS NULL
    OR lb.platform_commission_amount IS NULL
    OR lb.center_payout_amount IS NULL
  );

-- 5) Admin summary RPC to preview split totals (for payouts UI)
CREATE OR REPLACE FUNCTION public.admin_lab_split_summary(
  p_center_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  online_platform_receipts numeric,
  online_partner_payout_due numeric,
  cod_partner_receipts numeric,
  cod_platform_commission_due numeric,
  total_tests bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_admin_access() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT *
    FROM public.lab_bookings
    WHERE center_id = p_center_id
      AND booking_date >= p_start_date
      AND booking_date <= p_end_date
  )
  SELECT
    -- Online: platform collected the full amount, partner payout due equals partner_amount when paid
    COALESCE(SUM(CASE WHEN payment_method = 'online' AND payment_status = 'paid' 
                      THEN total_amount ELSE 0 END), 0) AS online_platform_receipts,
    COALESCE(SUM(CASE WHEN payment_method = 'online' AND payment_status = 'paid' 
                      THEN partner_amount ELSE 0 END), 0) AS online_partner_payout_due,
    -- COD: partner collected; our commission due is platform_commission_amount
    COALESCE(SUM(CASE WHEN payment_method = 'cod'
                      THEN total_amount ELSE 0 END), 0) AS cod_partner_receipts,
    COALESCE(SUM(CASE WHEN payment_method = 'cod'
                      THEN platform_commission_amount ELSE 0 END), 0) AS cod_platform_commission_due,
    COUNT(*)::bigint AS total_tests
  FROM filtered;
END;
$$;
