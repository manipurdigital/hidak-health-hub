-- Fix the composition key generation to ensure consistency

-- First, let's create improved functions for generating composition keys
CREATE OR REPLACE FUNCTION normalize_composition(composition TEXT)
RETURNS TEXT AS $$
BEGIN
  IF composition IS NULL OR trim(composition) = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(composition),
          '\s*\([^)]*\)\s*', '', 'g'  -- Remove all parentheses and content
        ),
        '[^a-zA-Z0-9\s]', ' ', 'g'    -- Replace special chars with spaces
      ),
      '\s+', '_', 'g'                 -- Replace spaces with underscores
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_composition_key(composition TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN normalize_composition(composition);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION generate_composition_family_key(composition TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
  active_ingredients TEXT[];
  ingredient TEXT;
BEGIN
  IF composition IS NULL OR trim(composition) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Normalize and extract active ingredients (remove dosages)
  normalized := lower(trim(composition));
  
  -- Remove common patterns like dosages, forms, etc.
  normalized := regexp_replace(normalized, '\s*\([^)]*\)\s*', ' ', 'g'); -- Remove parentheses
  normalized := regexp_replace(normalized, '[0-9]+\.?[0-9]*\s*(mg|g|ml|mcg|iu|%)', '', 'g'); -- Remove dosages
  normalized := regexp_replace(normalized, '\s+', ' ', 'g'); -- Normalize spaces
  normalized := trim(normalized);
  
  -- Split by common separators and clean up
  active_ingredients := string_to_array(normalized, '+');
  IF array_length(active_ingredients, 1) = 1 THEN
    active_ingredients := string_to_array(normalized, ',');
  END IF;
  IF array_length(active_ingredients, 1) = 1 THEN
    active_ingredients := string_to_array(normalized, '/');
  END IF;
  
  -- Clean and sort ingredients
  FOR i IN 1..array_length(active_ingredients, 1) LOOP
    ingredient := trim(active_ingredients[i]);
    -- Remove common salt names and forms
    ingredient := regexp_replace(ingredient, '\s+(hydrochloride|hcl|sulfate|sulphate|sodium|potassium|calcium|magnesium)$', '', 'i');
    ingredient := regexp_replace(ingredient, '[^a-zA-Z\s]', '', 'g');
    ingredient := trim(regexp_replace(ingredient, '\s+', ' ', 'g'));
    active_ingredients[i] := ingredient;
  END LOOP;
  
  -- Sort and join with consistent separator
  active_ingredients := (
    SELECT array_agg(ingredient ORDER BY ingredient)
    FROM unnest(active_ingredients) AS ingredient
    WHERE trim(ingredient) != ''
  );
  
  RETURN array_to_string(active_ingredients, '_');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing medicines with proper composition keys
UPDATE medicines 
SET 
  composition_key = generate_composition_key(composition_text),
  composition_family_key = generate_composition_family_key(composition_text)
WHERE composition_text IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_composition_key ON medicines(composition_key) WHERE composition_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medicines_composition_family_key ON medicines(composition_family_key) WHERE composition_family_key IS NOT NULL;