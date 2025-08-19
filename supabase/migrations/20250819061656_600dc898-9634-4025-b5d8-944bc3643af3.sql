-- Add tracking token expiry columns
ALTER TABLE public.orders 
ADD COLUMN tracking_token_expires_at timestamp with time zone;

ALTER TABLE public.lab_bookings 
ADD COLUMN tracking_token_expires_at timestamp with time zone;

-- Update the generate_tracking_token function to use 32-byte tokens
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Update order tracking token trigger with expiry
CREATE OR REPLACE FUNCTION public.set_order_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'out_for_delivery' AND (OLD.status IS NULL OR OLD.status != 'out_for_delivery') THEN
    NEW.tracking_token = generate_tracking_token();
    NEW.tracking_token_expires_at = now() + INTERVAL '24 hours';
    NEW.out_for_delivery_at = now();
  ELSIF NEW.status = 'delivered' THEN
    NEW.tracking_token = NULL; -- Invalidate token when delivered
    NEW.tracking_token_expires_at = NULL;
    NEW.delivered_at = now();
  ELSIF NEW.status = 'packed' AND (OLD.status IS NULL OR OLD.status != 'packed') THEN
    NEW.packed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Update lab booking tracking token trigger with expiry
CREATE OR REPLACE FUNCTION public.set_lab_booking_tracking_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'en_route' AND (OLD.status IS NULL OR OLD.status != 'en_route') THEN
    NEW.tracking_token = generate_tracking_token();
    NEW.tracking_token_expires_at = now() + INTERVAL '24 hours';
  ELSIF NEW.status = 'collected' THEN
    NEW.tracking_token = NULL; -- Invalidate token when collected
    NEW.tracking_token_expires_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Update tracking functions to check token expiry
CREATE OR REPLACE FUNCTION public.get_order_by_token(order_id uuid, token text)
RETURNS TABLE(
  id uuid, 
  order_number text, 
  status text, 
  total_amount numeric, 
  last_eta_mins integer, 
  last_distance_meters integer,
  created_at timestamp with time zone,
  out_for_delivery_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.last_eta_mins,
    o.last_distance_meters,
    o.created_at,
    o.out_for_delivery_at
  FROM orders o
  WHERE o.id = order_id 
    AND o.tracking_token = token 
    AND o.tracking_token IS NOT NULL
    AND o.tracking_token_expires_at > now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_lab_booking_by_token(booking_id uuid, token text)
RETURNS TABLE(
  id uuid, 
  patient_name text, 
  test_name text, 
  booking_date date, 
  time_slot text, 
  status text, 
  last_eta_mins integer, 
  last_distance_meters integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lb.id,
    -- Mask patient name for privacy (show only first name + asterisks)
    CASE 
      WHEN lb.patient_name IS NOT NULL AND length(lb.patient_name) > 0 THEN
        split_part(lb.patient_name, ' ', 1) || ' ' || repeat('*', greatest(1, length(lb.patient_name) - length(split_part(lb.patient_name, ' ', 1))))
      ELSE '***'
    END as patient_name,
    lt.name as test_name,
    lb.booking_date,
    lb.time_slot,
    lb.status,
    lb.last_eta_mins,
    lb.last_distance_meters
  FROM lab_bookings lb
  JOIN lab_tests lt ON lb.test_id = lt.id
  WHERE lb.id = booking_id 
    AND lb.tracking_token = token 
    AND lb.tracking_token IS NOT NULL
    AND lb.tracking_token_expires_at > now();
END;
$$;