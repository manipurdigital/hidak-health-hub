-- Create rider_start_by_assignment function
CREATE OR REPLACE FUNCTION public.rider_start_by_assignment(p_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignment_record RECORD;
BEGIN
  -- Get the assignment record with order info
  SELECT da.*, o.order_number
  INTO assignment_record
  FROM delivery_assignments da
  JOIN orders o ON o.id = da.order_id
  WHERE da.id = p_assignment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery assignment not found';
  END IF;
  
  -- Call the existing rider_start function with the order_id
  PERFORM public.rider_start(assignment_record.order_id);
END;
$$;

-- Create rider_complete_by_assignment function
CREATE OR REPLACE FUNCTION public.rider_complete_by_assignment(p_assignment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignment_record RECORD;
BEGIN
  -- Get the assignment record with order info
  SELECT da.*, o.order_number
  INTO assignment_record
  FROM delivery_assignments da
  JOIN orders o ON o.id = da.order_id
  WHERE da.id = p_assignment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery assignment not found';
  END IF;
  
  -- Call the existing rider_complete function with the order_id
  PERFORM public.rider_complete(assignment_record.order_id);
END;
$$;