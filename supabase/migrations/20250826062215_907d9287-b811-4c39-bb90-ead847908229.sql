-- RPC functions for delivery assignment management

-- Assign or reassign a rider by display keys
CREATE OR REPLACE FUNCTION public.admin_assign_rider(p_order_number text, p_rider_code text)
RETURNS uuid
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_order_id uuid; 
  v_rider_id uuid; 
  v_id uuid;
BEGIN
  IF NOT public.is_admin_claim() THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  SELECT id INTO v_order_id FROM public.orders WHERE order_number = p_order_number;
  IF v_order_id IS NULL THEN 
    RAISE EXCEPTION 'order not found'; 
  END IF;
  
  SELECT id INTO v_rider_id FROM public.riders WHERE code = p_rider_code AND is_active = true;
  IF v_rider_id IS NULL THEN 
    RAISE EXCEPTION 'rider not found or inactive'; 
  END IF;

  INSERT INTO public.delivery_assignments(order_id, rider_id, status)
  VALUES (v_order_id, v_rider_id, 'pending')
  ON CONFLICT (order_id) DO UPDATE
    SET rider_id = EXCLUDED.rider_id, 
        status = 'pending', 
        assigned_at = now();

  SELECT id INTO v_id FROM public.delivery_assignments WHERE order_id = v_order_id;
  RETURN v_id;
END $$;

-- Admin can force a status (timestamps auto-filled by trigger)
CREATE OR REPLACE FUNCTION public.admin_set_delivery_status(p_order_number text, p_status text)
RETURNS void
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE 
  v_order_id uuid;
BEGIN
  IF NOT public.is_admin_claim() THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  SELECT id INTO v_order_id FROM public.orders WHERE order_number = p_order_number;
  IF v_order_id IS NULL THEN 
    RAISE EXCEPTION 'order not found'; 
  END IF;
  
  UPDATE public.delivery_assignments
  SET status = p_status
  WHERE order_id = v_order_id;
END $$;

-- Rider actions for their jobs
CREATE OR REPLACE FUNCTION public.rider_start(p_order_id uuid) 
RETURNS void
LANGUAGE plpgsql 
SET search_path = public 
AS $$
BEGIN
  UPDATE public.delivery_assignments
  SET status = 'on_the_way'          -- trigger fills picked_up_at
  WHERE order_id = p_order_id
    AND EXISTS (
      SELECT 1 FROM public.riders r 
      WHERE r.id = rider_id AND r.user_id = auth.uid()
    );
END $$;

CREATE OR REPLACE FUNCTION public.rider_complete(p_order_id uuid) 
RETURNS void
LANGUAGE plpgsql 
SET search_path = public 
AS $$
BEGIN
  UPDATE public.delivery_assignments
  SET status = 'delivered'           -- trigger fills delivered_at (+ picked_up_at if missing)
  WHERE order_id = p_order_id
    AND EXISTS (
      SELECT 1 FROM public.riders r 
      WHERE r.id = rider_id AND r.user_id = auth.uid()
    );
END $$;