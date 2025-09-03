-- Add consultation_type column to consultations table
ALTER TABLE public.consultations 
ADD COLUMN consultation_type text DEFAULT 'text';