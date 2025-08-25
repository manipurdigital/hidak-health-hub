-- Fix inconsistent composition keys for metformin medicines
-- First, let's standardize the composition keys for all medicines

-- Update composition keys using our normalize function
UPDATE medicines 
SET 
    composition_key = generate_composition_key(composition_text),
    composition_family_key = generate_composition_family_key(composition_text)
WHERE composition_text IS NOT NULL AND is_active = true;

-- Specifically fix the metformin medicines to ensure they match
UPDATE medicines 
SET 
    composition_key = 'metformin_hydrochloride_500mg',
    composition_family_key = 'metformin'
WHERE composition_text ILIKE '%metformin%hydrochloride%' 
AND is_active = true;