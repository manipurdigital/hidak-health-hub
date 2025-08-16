-- Create lab_tests table
CREATE TABLE public.lab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  preparation_required BOOLEAN DEFAULT false,
  sample_type TEXT,
  reporting_time TEXT,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_bookings table
CREATE TABLE public.lab_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  special_instructions TEXT,
  total_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lab_reports table
CREATE TABLE public.lab_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID,
  report_name TEXT NOT NULL,
  report_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_size INTEGER,
  file_type TEXT
);

-- Enable Row Level Security
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_tests
CREATE POLICY "Lab tests are viewable by everyone" 
ON public.lab_tests 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage lab tests" 
ON public.lab_tests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lab_bookings
CREATE POLICY "Users can view their own bookings" 
ON public.lab_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.lab_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.lab_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and lab staff can view all bookings" 
ON public.lab_bookings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lab'::app_role));

-- RLS Policies for lab_reports
CREATE POLICY "Users can view their own reports" 
ON public.lab_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own reports" 
ON public.lab_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and doctors can view all reports" 
ON public.lab_reports 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

-- Create storage bucket for lab reports
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', false);

-- Storage policies for lab reports
CREATE POLICY "Users can view their own lab reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own lab reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lab-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins and doctors can view all lab reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lab-reports' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'doctor'::app_role)));

-- Create triggers for updated_at
CREATE TRIGGER update_lab_tests_updated_at
BEFORE UPDATE ON public.lab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lab_bookings_updated_at
BEFORE UPDATE ON public.lab_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample lab tests
INSERT INTO public.lab_tests (name, description, price, category, preparation_required, sample_type, reporting_time) VALUES
('Complete Blood Count (CBC)', 'Comprehensive blood analysis including RBC, WBC, platelets, and hemoglobin levels', 500, 'Blood Tests', false, 'Blood', '4-6 hours'),
('Lipid Profile', 'Cholesterol and triglyceride levels assessment', 800, 'Blood Tests', true, 'Blood', '6-8 hours'),
('Liver Function Test (LFT)', 'Assessment of liver health through enzyme levels', 1200, 'Blood Tests', true, 'Blood', '6-8 hours'),
('Thyroid Profile (T3, T4, TSH)', 'Complete thyroid function evaluation', 1500, 'Hormone Tests', false, 'Blood', '8-12 hours'),
('HbA1c (Diabetes)', 'Long-term blood sugar control assessment', 600, 'Diabetes', false, 'Blood', '4-6 hours'),
('Vitamin D3', 'Vitamin D deficiency screening', 1800, 'Vitamins', false, 'Blood', '12-24 hours'),
('Kidney Function Test (KFT)', 'Creatinine, urea, and kidney health assessment', 900, 'Blood Tests', false, 'Blood', '6-8 hours'),
('Urine Routine & Microscopy', 'Complete urine analysis for infections and abnormalities', 300, 'Urine Tests', false, 'Urine', '2-4 hours'),
('ECG (Electrocardiogram)', 'Heart rhythm and electrical activity assessment', 400, 'Cardiac Tests', false, 'None', 'Immediate'),
('X-Ray Chest', 'Chest imaging for lung and heart conditions', 800, 'Radiology', false, 'None', '2-4 hours');