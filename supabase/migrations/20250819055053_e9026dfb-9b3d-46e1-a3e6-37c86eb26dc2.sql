-- Backfill composition_text from brand column where brand looks like salt composition
-- and update composition keys for all medicines

-- First, create a helper function to detect if text looks like salt composition
CREATE OR REPLACE FUNCTION detect_salt_composition(text_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return true if the text contains common pharmaceutical patterns
  RETURN text_input ~* '(\d+\s*(mg|g|ml|mcg|iu|%)|paracetamol|acetaminophen|ibuprofen|aspirin|metformin|amlodipine|atorvastatin|omeprazole|losartan|diclofenac|cetirizine|amoxicillin|azithromycin|pantoprazole|ranitidine|ciprofloxacin)';
END;
$$;

-- Create a normalization function for composition
CREATE OR REPLACE FUNCTION normalize_composition(composition TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF composition IS NULL OR TRIM(composition) = '' THEN
    RETURN '';
  END IF;
  
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(composition, '\s+', ' ', 'g'),
        '[^\w\s\+\-\(\)\[\]\.]', '', 'g'
      )
    )
  );
END;
$$;

-- Create function to generate composition key
CREATE OR REPLACE FUNCTION generate_composition_key(composition TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT;
  ingredients TEXT[];
  ingredient TEXT;
  clean_ingredient TEXT;
BEGIN
  IF composition IS NULL OR TRIM(composition) = '' THEN
    RETURN '';
  END IF;
  
  normalized := normalize_composition(composition);
  
  -- Split by common separators and clean each ingredient
  ingredients := STRING_TO_ARRAY(
    REGEXP_REPLACE(normalized, '(\+|,|\band\b)', '|', 'g'), 
    '|'
  );
  
  -- Clean each ingredient by removing dosage info and sort
  FOR i IN 1..ARRAY_LENGTH(ingredients, 1) LOOP
    ingredient := TRIM(ingredients[i]);
    -- Remove dosage patterns (number + unit)
    clean_ingredient := REGEXP_REPLACE(
      ingredient, 
      '\s*\d+\.?\d*\s*(mg|g|ml|mcg|iu|%)\s*', 
      '', 
      'g'
    );
    clean_ingredient := TRIM(clean_ingredient);
    
    IF LENGTH(clean_ingredient) > 0 THEN
      ingredients[i] := clean_ingredient;
    ELSE
      ingredients[i] := NULL;
    END IF;
  END LOOP;
  
  -- Remove nulls and sort
  ingredients := (
    SELECT ARRAY_AGG(ingredient ORDER BY ingredient)
    FROM UNNEST(ingredients) AS ingredient
    WHERE ingredient IS NOT NULL AND LENGTH(TRIM(ingredient)) > 0
  );
  
  RETURN ARRAY_TO_STRING(ingredients, '+');
END;
$$;

-- Create function to generate composition family key  
CREATE OR REPLACE FUNCTION generate_composition_family_key(composition TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  normalized TEXT;
  ingredients TEXT[];
  ingredient TEXT;
  active_ingredient TEXT;
  active_ingredients TEXT[];
BEGIN
  IF composition IS NULL OR TRIM(composition) = '' THEN
    RETURN '';
  END IF;
  
  normalized := normalize_composition(composition);
  
  -- Split by common separators
  ingredients := STRING_TO_ARRAY(
    REGEXP_REPLACE(normalized, '(\+|,|\band\b)', '|', 'g'), 
    '|'
  );
  
  -- Extract active ingredient names (before any numbers)
  FOR i IN 1..ARRAY_LENGTH(ingredients, 1) LOOP
    ingredient := TRIM(ingredients[i]);
    -- Extract the active ingredient name (alphabetic part before numbers)
    active_ingredient := TRIM(REGEXP_REPLACE(ingredient, '^([a-zA-Z\s\-]+).*', '\1'));
    
    IF LENGTH(active_ingredient) > 2 THEN
      active_ingredients := ARRAY_APPEND(active_ingredients, active_ingredient);
    END IF;
  END LOOP;
  
  -- Remove duplicates and sort
  active_ingredients := (
    SELECT ARRAY_AGG(DISTINCT ingredient ORDER BY ingredient)
    FROM UNNEST(active_ingredients) AS ingredient
    WHERE ingredient IS NOT NULL AND LENGTH(TRIM(ingredient)) > 2
  );
  
  RETURN ARRAY_TO_STRING(active_ingredients, '+');
END;
$$;

-- Backfill composition_text from brand where it looks like salt composition
UPDATE medicines 
SET composition_text = brand
WHERE brand IS NOT NULL 
  AND (composition_text IS NULL OR composition_text = '')
  AND detect_salt_composition(brand);

-- Clear brand field where we moved it to composition_text (optional - comment out if you want to keep both)
UPDATE medicines 
SET brand = NULL
WHERE brand IS NOT NULL 
  AND composition_text = brand
  AND detect_salt_composition(brand);

-- Update all composition keys for existing medicines
UPDATE medicines 
SET 
  composition_key = generate_composition_key(composition_text),
  composition_family_key = generate_composition_family_key(composition_text)
WHERE composition_text IS NOT NULL AND composition_text != '';

-- Create an improved universal search function that prioritizes brand/trade name
CREATE OR REPLACE FUNCTION universal_search_v3(
  q TEXT,
  max_per_group INTEGER DEFAULT 5
)
RETURNS TABLE (
  type TEXT,
  id TEXT,
  title TEXT,
  subtitle TEXT,
  thumbnail_url TEXT,
  price NUMERIC,
  href TEXT,
  group_key TEXT,
  rank_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH medicine_search AS (
    SELECT 
      'medicine'::TEXT as type,
      m.id::TEXT,
      m.name as title,
      COALESCE(m.composition_text, m.generic_name, 'Generic medicine') as subtitle,
      m.thumbnail_url,
      m.price,
      '/medicines/' || m.id as href,
      COALESCE(m.composition_family_key, m.id::TEXT) as group_key,
      -- Ranking: Brand/Trade name first, then synonyms, then composition
      (CASE 
        WHEN m.name ILIKE '%' || q || '%' THEN 100.0
        WHEN EXISTS(SELECT 1 FROM UNNEST(m.brand_synonyms) AS syn WHERE syn ILIKE '%' || q || '%') THEN 80.0
        WHEN m.composition_text ILIKE '%' || q || '%' THEN 60.0
        WHEN m.generic_name ILIKE '%' || q || '%' THEN 40.0
        ELSE 20.0
      END) as rank_score
    FROM medicines m
    WHERE m.is_active = true
      AND (
        m.name ILIKE '%' || q || '%'
        OR m.composition_text ILIKE '%' || q || '%'
        OR m.generic_name ILIKE '%' || q || '%'
        OR EXISTS(SELECT 1 FROM UNNEST(m.brand_synonyms) AS syn WHERE syn ILIKE '%' || q || '%')
      )
  ),
  doctor_search AS (
    SELECT 
      'doctor'::TEXT as type,
      d.id::TEXT,
      d.full_name as title,
      d.specialization as subtitle,
      d.profile_image_url as thumbnail_url,
      d.consultation_fee as price,
      '/doctors/' || d.id as href,
      d.specialization as group_key,
      50.0 as rank_score
    FROM doctors d
    WHERE d.is_available = true
      AND d.is_verified = true
      AND (
        d.full_name ILIKE '%' || q || '%'
        OR d.specialization ILIKE '%' || q || '%'
      )
  ),
  lab_test_search AS (
    SELECT 
      'lab_test'::TEXT as type,
      lt.id::TEXT,
      lt.name as title,
      COALESCE(lt.category, 'Lab Test') as subtitle,
      lt.image_url as thumbnail_url,
      lt.price,
      '/lab-tests/' || lt.id as href,
      COALESCE(lt.category, 'general') as group_key,
      30.0 as rank_score
    FROM lab_tests lt
    WHERE lt.is_active = true
      AND lt.name ILIKE '%' || q || '%'
  ),
  all_results AS (
    SELECT * FROM medicine_search
    UNION ALL
    SELECT * FROM doctor_search
    UNION ALL
    SELECT * FROM lab_test_search
  ),
  ranked_results AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (PARTITION BY type, group_key ORDER BY rank_score DESC, title) as rn
    FROM all_results
    ORDER BY rank_score DESC, type, title
  )
  SELECT 
    r.type,
    r.id,
    r.title,
    r.subtitle,
    r.thumbnail_url,
    r.price,
    r.href,
    r.group_key,
    r.rank_score
  FROM ranked_results r
  WHERE r.rn <= max_per_group
  ORDER BY r.rank_score DESC, r.type, r.title;
END;
$$;

-- Update existing search function to use the improved version
CREATE OR REPLACE FUNCTION universal_search_v2(
  q TEXT,
  max_per_group INTEGER DEFAULT 5
)
RETURNS TABLE (
  type TEXT,
  id TEXT,
  title TEXT,
  subtitle TEXT,
  thumbnail_url TEXT,
  price NUMERIC,
  href TEXT,
  group_key TEXT
)
LANGUAGE sql
AS $$
  SELECT 
    type, id, title, subtitle, thumbnail_url, price, href, group_key
  FROM universal_search_v3(q, max_per_group);
$$;