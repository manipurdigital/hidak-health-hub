-- Create riders table
CREATE TABLE IF NOT EXISTS public.riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  vehicle_type text CHECK (vehicle_type IN ('bike','car','scooter','other')) DEFAULT 'bike',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create delivery_jobs table (extends existing delivery_assignments)
CREATE TABLE IF NOT EXISTS public.delivery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  rider_id uuid REFERENCES public.riders ON DELETE SET NULL,
  pickup_address jsonb NOT NULL,
  delivery_address jsonb NOT NULL,
  status text CHECK (status IN ('pending','assigned','picked_up','in_transit','delivered','cancelled')) DEFAULT 'pending',
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  estimated_delivery_time timestamptz,
  actual_delivery_time timestamptz,
  delivery_fee numeric(10,2) DEFAULT 0,
  distance_km numeric(10,2),
  notes text,
  customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create rider_shifts table for tracking rider availability
CREATE TABLE IF NOT EXISTS public.rider_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.riders ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text CHECK (status IN ('scheduled','active','completed','cancelled')) DEFAULT 'scheduled',
  earnings numeric(10,2) DEFAULT 0,
  deliveries_completed integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rider_id, shift_date)
);

-- Enable RLS on all tables
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for riders
CREATE POLICY "Admins can manage all riders" ON public.riders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can view their own profile" ON public.riders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Riders can update their own profile" ON public.riders
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for delivery_jobs
CREATE POLICY "Admins can manage all delivery jobs" ON public.delivery_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can view their assigned jobs" ON public.delivery_jobs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = delivery_jobs.rider_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Riders can update their assigned jobs" ON public.delivery_jobs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = delivery_jobs.rider_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own delivery jobs" ON public.delivery_jobs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = delivery_jobs.order_id AND o.user_id = auth.uid()
  ));

-- RLS Policies for rider_shifts
CREATE POLICY "Admins can manage all rider shifts" ON public.rider_shifts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can manage their own shifts" ON public.rider_shifts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = rider_shifts.rider_id AND r.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.riders r 
    WHERE r.id = rider_shifts.rider_id AND r.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_code ON public.riders(code);
CREATE INDEX IF NOT EXISTS idx_riders_is_active ON public.riders(is_active);

CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order_id ON public.delivery_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_rider_id ON public.delivery_jobs(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON public.delivery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_created_at ON public.delivery_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_rider_shifts_rider_id ON public.rider_shifts(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_shifts_shift_date ON public.rider_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_rider_shifts_status ON public.rider_shifts(status);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_riders_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_jobs_updated_at
  BEFORE UPDATE ON public.delivery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rider_shifts_updated_at
  BEFORE UPDATE ON public.rider_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer functions for delivery management
CREATE OR REPLACE FUNCTION public.assign_delivery_job(
  p_job_id uuid,
  p_rider_id uuid,
  p_estimated_delivery_time timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can assign jobs
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can assign delivery jobs';
  END IF;

  -- Check if rider is active
  IF NOT EXISTS (SELECT 1 FROM public.riders WHERE id = p_rider_id AND is_active = true) THEN
    RAISE EXCEPTION 'Rider is not active';
  END IF;

  -- Update the delivery job
  UPDATE public.delivery_jobs 
  SET 
    rider_id = p_rider_id,
    status = 'assigned',
    assigned_at = now(),
    estimated_delivery_time = COALESCE(p_estimated_delivery_time, now() + INTERVAL '2 hours'),
    updated_at = now()
  WHERE id = p_job_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery job not found or already assigned';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_delivery_status(
  p_job_id uuid,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_rider_id uuid;
BEGIN
  -- Get the current rider for this job
  SELECT rider_id INTO current_rider_id 
  FROM public.delivery_jobs 
  WHERE id = p_job_id;

  -- Check if user is admin or the assigned rider
  IF NOT (has_role(auth.uid(), 'admin'::app_role) OR 
          EXISTS (SELECT 1 FROM public.riders WHERE id = current_rider_id AND user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to update this delivery job';
  END IF;

  -- Update the delivery job with appropriate timestamps
  UPDATE public.delivery_jobs 
  SET 
    status = p_status,
    notes = COALESCE(p_notes, notes),
    picked_up_at = CASE WHEN p_status = 'picked_up' THEN now() ELSE picked_up_at END,
    delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
    actual_delivery_time = CASE WHEN p_status = 'delivered' THEN now() ELSE actual_delivery_time END,
    updated_at = now()
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery job not found';
  END IF;

  -- Update rider shift earnings if delivered
  IF p_status = 'delivered' THEN
    UPDATE public.rider_shifts 
    SET 
      deliveries_completed = deliveries_completed + 1,
      earnings = earnings + COALESCE((SELECT delivery_fee FROM public.delivery_jobs WHERE id = p_job_id), 0),
      updated_at = now()
    WHERE rider_id = current_rider_id 
      AND shift_date = CURRENT_DATE 
      AND status = 'active';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_delivery_job_for_order(
  p_order_id uuid,
  p_pickup_address jsonb,
  p_delivery_address jsonb,
  p_delivery_fee numeric DEFAULT 0,
  p_distance_km numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_id uuid;
BEGIN
  -- Only create if order exists and doesn't already have a delivery job
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF EXISTS (SELECT 1 FROM public.delivery_jobs WHERE order_id = p_order_id) THEN
    RAISE EXCEPTION 'Delivery job already exists for this order';
  END IF;

  -- Create the delivery job
  INSERT INTO public.delivery_jobs (
    order_id,
    pickup_address,
    delivery_address,
    delivery_fee,
    distance_km,
    status
  ) VALUES (
    p_order_id,
    p_pickup_address,
    p_delivery_address,
    p_delivery_fee,
    p_distance_km,
    'pending'
  ) RETURNING id INTO job_id;

  RETURN job_id;
END;
$$;