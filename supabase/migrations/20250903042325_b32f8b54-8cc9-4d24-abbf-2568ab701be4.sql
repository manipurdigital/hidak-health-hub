-- Add fields to align with Tata 1mg medicine structure
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS salt_composition TEXT,
ADD COLUMN IF NOT EXISTS uses TEXT,
ADD COLUMN IF NOT EXISTS side_effects TEXT,
ADD COLUMN IF NOT EXISTS how_to_use TEXT,
ADD COLUMN IF NOT EXISTS how_it_works TEXT,
ADD COLUMN IF NOT EXISTS safety_advice TEXT,
ADD COLUMN IF NOT EXISTS what_if_you_forget TEXT,
ADD COLUMN IF NOT EXISTS facts TEXT,
ADD COLUMN IF NOT EXISTS substitute_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS habit_forming BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS therapeutic_class TEXT,
ADD COLUMN IF NOT EXISTS chemical_class TEXT,
ADD COLUMN IF NOT EXISTS action_class TEXT,
ADD COLUMN IF NOT EXISTS mrp NUMERIC,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC,
ADD COLUMN IF NOT EXISTS pack_size_unit TEXT,
ADD COLUMN IF NOT EXISTS dosage_strength TEXT,
ADD COLUMN IF NOT EXISTS route_of_administration TEXT,
ADD COLUMN IF NOT EXISTS prescription_type TEXT,
ADD COLUMN IF NOT EXISTS storage_conditions TEXT,
ADD COLUMN IF NOT EXISTS country_of_origin TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS marketed_by TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TEXT,
ADD COLUMN IF NOT EXISTS faq JSONB,
ADD COLUMN IF NOT EXISTS key_highlights JSONB,
ADD COLUMN IF NOT EXISTS interaction_warnings JSONB,
ADD COLUMN IF NOT EXISTS alternative_brands JSONB;

-- Create index for salt_composition for better search performance
CREATE INDEX IF NOT EXISTS idx_medicines_salt_composition ON public.medicines USING GIN (to_tsvector('english', salt_composition));

-- Create index for therapeutic_class for filtering
CREATE INDEX IF NOT EXISTS idx_medicines_therapeutic_class ON public.medicines (therapeutic_class);

-- Add constraints for enum-like fields
ALTER TABLE public.medicines 
ADD CONSTRAINT check_prescription_type 
CHECK (prescription_type IS NULL OR prescription_type IN ('OTC', 'Prescription Required', 'Schedule H', 'Schedule H1', 'Schedule X'));

-- Update existing composition field to be more descriptive if empty and salt_composition exists
-- This will be handled in the application logic to maintain data integrity