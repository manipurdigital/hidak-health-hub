-- Add missing columns to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS hospital_affiliation text,
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Add missing columns to lab_bookings table
ALTER TABLE public.lab_bookings 
ADD COLUMN IF NOT EXISTS center_payout_amount numeric DEFAULT 0;

-- Add missing columns to doctor_availability table
ALTER TABLE public.doctor_availability 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add missing columns to consultations table
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS patient_notes text;

-- Add missing columns to delivery_assignments table
ALTER TABLE public.delivery_assignments 
ADD COLUMN IF NOT EXISTS center_payout_amount numeric DEFAULT 0;

-- Update existing doctors with default values for new columns
UPDATE public.doctors 
SET 
  contact_email = CASE WHEN contact_email IS NULL THEN 'doctor@example.com' ELSE contact_email END,
  hospital_affiliation = CASE WHEN hospital_affiliation IS NULL THEN 'General Practice' ELSE hospital_affiliation END,
  languages = CASE WHEN languages IS NULL THEN ARRAY['English'] ELSE languages END,
  rating = CASE WHEN rating IS NULL THEN 4.5 ELSE rating END,
  review_count = CASE WHEN review_count IS NULL THEN 0 ELSE review_count END
WHERE contact_email IS NULL OR hospital_affiliation IS NULL OR languages IS NULL OR rating IS NULL OR review_count IS NULL;