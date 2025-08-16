-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT,
  experience_years INTEGER,
  consultation_fee NUMERIC NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  languages TEXT[],
  hospital_affiliation TEXT,
  license_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor_availability table
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  consultation_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
  consultation_type TEXT DEFAULT 'text', -- text, audio, video
  total_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  patient_notes TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultation_messages table
CREATE TABLE public.consultation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL, -- patient, doctor
  message_type TEXT DEFAULT 'text', -- text, image, file
  content TEXT NOT NULL,
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  prescription_number TEXT NOT NULL,
  medications JSONB NOT NULL, -- Array of medication objects
  diagnosis TEXT,
  instructions TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'active', -- active, fulfilled, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors
CREATE POLICY "Doctors are viewable by everyone" 
ON public.doctors 
FOR SELECT 
USING (is_available = true);

CREATE POLICY "Doctors can manage their own profile" 
ON public.doctors 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all doctors" 
ON public.doctors 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for doctor_availability
CREATE POLICY "Doctor availability is viewable by everyone" 
ON public.doctor_availability 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Doctors can manage their own availability" 
ON public.doctor_availability 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = doctor_availability.doctor_id 
  AND doctors.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = doctor_availability.doctor_id 
  AND doctors.user_id = auth.uid()
));

-- RLS Policies for consultations
CREATE POLICY "Patients can view their own consultations" 
ON public.consultations 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their consultations" 
ON public.consultations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = consultations.doctor_id 
  AND doctors.user_id = auth.uid()
));

CREATE POLICY "Patients can create consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients and doctors can update consultations" 
ON public.consultations 
FOR UPDATE 
USING (
  auth.uid() = patient_id OR 
  EXISTS (
    SELECT 1 FROM public.doctors 
    WHERE doctors.id = consultations.doctor_id 
    AND doctors.user_id = auth.uid()
  )
);

-- RLS Policies for consultation_messages
CREATE POLICY "Patients can view messages from their consultations" 
ON public.consultation_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.consultations 
  WHERE consultations.id = consultation_messages.consultation_id 
  AND consultations.patient_id = auth.uid()
));

CREATE POLICY "Doctors can view messages from their consultations" 
ON public.consultation_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.consultations 
  INNER JOIN public.doctors ON doctors.id = consultations.doctor_id
  WHERE consultations.id = consultation_messages.consultation_id 
  AND doctors.user_id = auth.uid()
));

CREATE POLICY "Patients and doctors can send messages" 
ON public.consultation_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their own prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view and manage their prescriptions" 
ON public.prescriptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = prescriptions.doctor_id 
  AND doctors.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = prescriptions.doctor_id 
  AND doctors.user_id = auth.uid()
));

-- Create foreign key constraints
ALTER TABLE public.doctor_availability 
ADD CONSTRAINT fk_doctor_availability_doctor 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.consultations 
ADD CONSTRAINT fk_consultations_doctor 
FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.consultation_messages 
ADD CONSTRAINT fk_consultation_messages_consultation 
FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;

ALTER TABLE public.prescriptions 
ADD CONSTRAINT fk_prescriptions_consultation 
FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate prescription number
CREATE OR REPLACE FUNCTION public.generate_prescription_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prescription_num TEXT;
BEGIN
  prescription_num := 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
  RETURN prescription_num;
END;
$$;

-- Create trigger to auto-generate prescription number
CREATE OR REPLACE FUNCTION public.set_prescription_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.prescription_number IS NULL THEN
    NEW.prescription_number := generate_prescription_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_prescription_number_trigger
BEFORE INSERT ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_prescription_number();

-- Insert sample doctors
INSERT INTO public.doctors (user_id, full_name, specialization, qualification, experience_years, consultation_fee, bio, languages, hospital_affiliation, is_verified) VALUES
(gen_random_uuid(), 'Dr. Sarah Johnson', 'Cardiology', 'MBBS, MD Cardiology', 15, 800, 'Experienced cardiologist specializing in heart disease prevention and treatment', ARRAY['English', 'Hindi'], 'Apollo Hospital', true),
(gen_random_uuid(), 'Dr. Rajesh Kumar', 'Dermatology', 'MBBS, MD Dermatology', 12, 600, 'Skin specialist with expertise in cosmetic and medical dermatology', ARRAY['English', 'Hindi', 'Tamil'], 'Max Healthcare', true),
(gen_random_uuid(), 'Dr. Priya Sharma', 'Pediatrics', 'MBBS, MD Pediatrics', 10, 500, 'Child health specialist with focus on growth and development', ARRAY['English', 'Hindi'], 'Fortis Hospital', true),
(gen_random_uuid(), 'Dr. Michael Chen', 'Orthopedics', 'MBBS, MS Orthopedics', 18, 900, 'Joint replacement and sports injury specialist', ARRAY['English'], 'Manipal Hospital', true),
(gen_random_uuid(), 'Dr. Anita Gupta', 'Gynecology', 'MBBS, MD Gynecology', 14, 700, 'Women health specialist with expertise in reproductive health', ARRAY['English', 'Hindi'], 'Medanta Hospital', true),
(gen_random_uuid(), 'Dr. David Smith', 'Neurology', 'MBBS, DM Neurology', 20, 1000, 'Neurologist specializing in brain and nervous system disorders', ARRAY['English'], 'AIIMS', true);

-- Insert sample availability (assuming doctor IDs from above)
INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time) 
SELECT 
  id, 
  generate_series(1, 5) as day_of_week, -- Monday to Friday
  '09:00'::time,
  '17:00'::time
FROM public.doctors 
WHERE is_verified = true;