-- Create courier_locations table for tracking
CREATE TABLE public.courier_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID,
  center_type TEXT NOT NULL CHECK (center_type IN ('lab', 'delivery')),
  booking_id UUID REFERENCES lab_bookings(id),
  order_id UUID REFERENCES orders(id),
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  speed_mps NUMERIC DEFAULT 0,
  heading NUMERIC DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_courier_locations_booking_recorded ON courier_locations(booking_id, recorded_at DESC);
CREATE INDEX idx_courier_locations_order_recorded ON courier_locations(order_id, recorded_at DESC);
CREATE INDEX idx_courier_locations_center_type ON courier_locations(center_id, center_type);

-- Add tracking fields to lab_bookings
ALTER TABLE public.lab_bookings 
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_eta_mins INTEGER,
ADD COLUMN IF NOT EXISTS last_distance_meters INTEGER;

-- Add tracking fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_center_id UUID,
ADD COLUMN IF NOT EXISTS courier_user_id UUID,
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_eta_mins INTEGER,
ADD COLUMN IF NOT EXISTS last_distance_meters INTEGER;

-- Add lat/lng to addresses for geocoding
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- RLS Policies for courier_locations
ALTER TABLE public.courier_locations ENABLE ROW LEVEL SECURITY;

-- Center staff can insert location updates for their assigned jobs
CREATE POLICY "Center staff can insert courier locations for assigned jobs" 
ON public.courier_locations 
FOR INSERT 
WITH CHECK (
  -- Check if user is center staff and job is assigned to their center
  (center_type = 'lab' AND booking_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM lab_bookings lb 
    WHERE lb.id = booking_id 
    AND lb.center_id = center_id
    AND EXISTS (
      SELECT 1 FROM center_staff cs 
      WHERE cs.user_id = auth.uid() 
      AND cs.center_id = lb.center_id 
      AND cs.is_active = true
    )
  ))
  OR
  (center_type = 'delivery' AND order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_id 
    AND o.delivery_center_id = center_id
    AND (o.courier_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM center_staff cs 
      WHERE cs.user_id = auth.uid() 
      AND cs.center_id = o.delivery_center_id 
      AND cs.is_active = true
    ))
  ))
);

-- Admins can read all courier locations
CREATE POLICY "Admins can read all courier locations" 
ON public.courier_locations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Center staff can read locations for their center
CREATE POLICY "Center staff can read their center locations" 
ON public.courier_locations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM center_staff cs 
    WHERE cs.user_id = auth.uid() 
    AND cs.center_id = center_id 
    AND cs.is_active = true
  )
);

-- Function to generate tracking tokens
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set tracking token on lab bookings
CREATE OR REPLACE FUNCTION public.set_lab_booking_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'en_route' AND (OLD.status IS NULL OR OLD.status != 'en_route') THEN
    NEW.tracking_token = generate_tracking_token();
  ELSIF NEW.status = 'collected' THEN
    NEW.tracking_token = NULL; -- Invalidate token when collected
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set tracking token on orders
CREATE OR REPLACE FUNCTION public.set_order_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'out_for_delivery' AND (OLD.status IS NULL OR OLD.status != 'out_for_delivery') THEN
    NEW.tracking_token = generate_tracking_token();
    NEW.out_for_delivery_at = now();
  ELSIF NEW.status = 'delivered' THEN
    NEW.tracking_token = NULL; -- Invalidate token when delivered
    NEW.delivered_at = now();
  ELSIF NEW.status = 'packed' AND (OLD.status IS NULL OR OLD.status != 'packed') THEN
    NEW.packed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER set_lab_booking_tracking_token_trigger
  BEFORE UPDATE ON public.lab_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_lab_booking_tracking_token();

CREATE TRIGGER set_order_tracking_token_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_tracking_token();

-- Function to clean old courier locations (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_courier_locations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.courier_locations 
  WHERE recorded_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public tracking access functions
CREATE OR REPLACE FUNCTION public.get_lab_booking_by_token(booking_id UUID, token TEXT)
RETURNS TABLE(
  id UUID,
  patient_name TEXT,
  test_name TEXT,
  booking_date DATE,
  time_slot TEXT,
  status TEXT,
  last_eta_mins INTEGER,
  last_distance_meters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lb.id,
    lb.patient_name,
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
    AND lb.tracking_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_order_by_token(order_id UUID, token TEXT)
RETURNS TABLE(
  id UUID,
  order_number TEXT,
  status TEXT,
  total_amount NUMERIC,
  last_eta_mins INTEGER,
  last_distance_meters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.last_eta_mins,
    o.last_distance_meters
  FROM orders o
  WHERE o.id = order_id 
    AND o.tracking_token = token 
    AND o.tracking_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest courier location for tracking
CREATE OR REPLACE FUNCTION public.get_latest_courier_location(job_type TEXT, job_id UUID)
RETURNS TABLE(
  lat NUMERIC,
  lng NUMERIC,
  speed_mps NUMERIC,
  heading NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.lat,
    cl.lng,
    cl.speed_mps,
    cl.heading,
    cl.recorded_at
  FROM courier_locations cl
  WHERE (
    (job_type = 'lab' AND cl.booking_id = job_id) OR
    (job_type = 'delivery' AND cl.order_id = job_id)
  )
  ORDER BY cl.recorded_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;