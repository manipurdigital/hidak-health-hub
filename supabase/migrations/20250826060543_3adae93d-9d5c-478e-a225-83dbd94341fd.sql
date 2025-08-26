-- Create riders table
CREATE TABLE IF NOT EXISTS public.riders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'car', 'scooter', 'other')) DEFAULT 'bike',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_jobs table
CREATE TABLE IF NOT EXISTS public.delivery_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  actual_delivery_time TIMESTAMP WITH TIME ZONE,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  distance_km NUMERIC(8,2),
  notes TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rider_shifts table
CREATE TABLE IF NOT EXISTS public.rider_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES public.riders(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')) DEFAULT 'scheduled',
  earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
  deliveries_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_shifts ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Admin can manage riders" ON public.riders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can manage delivery jobs" ON public.delivery_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin can manage rider shifts" ON public.rider_shifts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_is_active ON public.riders(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_order_id ON public.delivery_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_rider_id ON public.delivery_jobs(rider_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON public.delivery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rider_shifts_rider_id ON public.rider_shifts(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_shifts_date ON public.rider_shifts(shift_date);

-- Create updated_at triggers
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