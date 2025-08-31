-- Add missing columns to doctors table
ALTER TABLE public.doctors 
ADD COLUMN contact_email text,
ADD COLUMN hospital_affiliation text,
ADD COLUMN languages text[],
ADD COLUMN rating numeric DEFAULT 4.5,
ADD COLUMN review_count integer DEFAULT 0;

-- Add missing columns to lab_bookings table
ALTER TABLE public.lab_bookings 
ADD COLUMN center_payout_amount numeric DEFAULT 0;

-- Add missing columns to doctor_availability table
ALTER TABLE public.doctor_availability 
ADD COLUMN is_active boolean DEFAULT true;

-- Add missing columns to consultations table
ALTER TABLE public.consultations 
ADD COLUMN patient_notes text;

-- Add missing columns to delivery_assignments table
ALTER TABLE public.delivery_assignments 
ADD COLUMN center_payout_amount numeric DEFAULT 0;

-- Update existing doctors with default values for new columns
UPDATE public.doctors 
SET 
  contact_email = COALESCE(contact_email, email),
  hospital_affiliation = COALESCE(hospital_affiliation, 'General Practice'),
  languages = COALESCE(languages, ARRAY['English']),
  rating = COALESCE(rating, 4.5),
  review_count = COALESCE(review_count, 0)
WHERE contact_email IS NULL OR hospital_affiliation IS NULL OR languages IS NULL;