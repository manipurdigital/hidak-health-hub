-- Add missing columns to medicines table
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS fast_delivery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Add missing columns to medicine_categories table  
ALTER TABLE public.medicine_categories
ADD COLUMN IF NOT EXISTS icon text DEFAULT '💊';

-- Add missing columns to lab_tests table
ALTER TABLE public.lab_tests
ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
ADD COLUMN IF NOT EXISTS sample_type text DEFAULT 'Blood',
ADD COLUMN IF NOT EXISTS reporting_time text DEFAULT '24 hours',
ADD COLUMN IF NOT EXISTS preparation_required boolean DEFAULT false;

-- Update existing records with default values
UPDATE public.medicines 
SET 
  brand = CASE WHEN brand IS NULL THEN manufacturer ELSE brand END,
  original_price = CASE WHEN original_price IS NULL THEN price * 1.2 ELSE original_price END,
  discount_percentage = CASE WHEN discount_percentage IS NULL THEN 10 ELSE discount_percentage END,
  fast_delivery = CASE WHEN fast_delivery IS NULL THEN false ELSE fast_delivery END,
  rating = CASE WHEN rating IS NULL THEN 4.5 ELSE rating END,
  review_count = CASE WHEN review_count IS NULL THEN 0 ELSE review_count END
WHERE brand IS NULL OR original_price IS NULL OR discount_percentage IS NULL OR fast_delivery IS NULL OR rating IS NULL OR review_count IS NULL;

-- Add prescription_required column alias to match frontend expectation
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS requires_prescription boolean DEFAULT false;

-- Update requires_prescription based on prescription_required
UPDATE public.medicines 
SET requires_prescription = prescription_required 
WHERE requires_prescription IS NULL;