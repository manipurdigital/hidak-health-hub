-- Create diagnostic_centers table
CREATE TABLE public.diagnostic_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  service_areas TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create center_staff table
CREATE TABLE public.center_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.diagnostic_centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(center_id, user_id)
);

-- Add missing fields to lab_bookings
ALTER TABLE public.lab_bookings 
ADD COLUMN center_id UUID REFERENCES public.diagnostic_centers(id),
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN center_payout_rate NUMERIC DEFAULT 0.30,
ADD COLUMN center_payout_amount NUMERIC;

-- Enable RLS on new tables
ALTER TABLE public.diagnostic_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_staff ENABLE ROW LEVEL SECURITY;

-- RLS policies for diagnostic_centers
CREATE POLICY "Admins can manage all centers" 
ON public.diagnostic_centers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Centers are viewable by authenticated users" 
ON public.diagnostic_centers 
FOR SELECT 
USING (is_active = true AND auth.role() = 'authenticated');

-- RLS policies for center_staff
CREATE POLICY "Admins can manage all center staff" 
ON public.center_staff 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Center staff can view their own records" 
ON public.center_staff 
FOR SELECT 
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Center users can view staff in their center" 
ON public.center_staff 
FOR SELECT 
USING (
  is_active = true AND 
  center_id IN (
    SELECT center_id 
    FROM public.center_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_diagnostic_centers_updated_at
BEFORE UPDATE ON public.diagnostic_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_center_staff_updated_at
BEFORE UPDATE ON public.center_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();