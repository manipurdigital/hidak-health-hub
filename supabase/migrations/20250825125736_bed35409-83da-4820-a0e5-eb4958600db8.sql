-- Fix critical security issue - Enable RLS on public schema views that don't have it

-- First, let's check what tables in public schema don't have RLS
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE format('SELECT relrowsecurity FROM pg_class WHERE relname = %L', tbl.tablename);
            IF NOT FOUND THEN
                RAISE NOTICE 'Table %.% may need RLS enabled', tbl.schemaname, tbl.tablename;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not check RLS for %.%', tbl.schemaname, tbl.tablename;
        END;
    END LOOP;
END $$;

-- Fix the functions that need search_path - update the functions we just created with proper security
CREATE OR REPLACE FUNCTION normalize_composition(composition TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION generate_composition_key(composition TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN normalize_composition(composition);
END;
$$;

CREATE OR REPLACE FUNCTION generate_composition_family_key(composition TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
  active_ingredients TEXT[];
  ingredient TEXT;
  cleaned_ingredients TEXT[];
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
  cleaned_ingredients := ARRAY[]::TEXT[];
  FOR i IN 1..array_length(active_ingredients, 1) LOOP
    ingredient := trim(active_ingredients[i]);
    -- Remove common salt names and forms
    ingredient := regexp_replace(ingredient, '\s+(hydrochloride|hcl|sulfate|sulphate|sodium|potassium|calcium|magnesium)$', '', 'i');
    ingredient := regexp_replace(ingredient, '[^a-zA-Z\s]', '', 'g');
    ingredient := trim(regexp_replace(ingredient, '\s+', ' ', 'g'));
    IF trim(ingredient) != '' THEN
      cleaned_ingredients := array_append(cleaned_ingredients, ingredient);
    END IF;
  END LOOP;
  
  -- Sort ingredients
  SELECT array_agg(ing ORDER BY ing) INTO cleaned_ingredients
  FROM unnest(cleaned_ingredients) AS ing;
  
  RETURN array_to_string(cleaned_ingredients, '_');
END;
$$;