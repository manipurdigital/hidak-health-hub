-- Create trigram extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create universal search RPC function
CREATE OR REPLACE FUNCTION public.universal_search(
  q text,
  max_per_group int DEFAULT 5
)
RETURNS TABLE (
  type text,
  id uuid,
  title text,
  subtitle text,
  thumbnail_url text,
  price numeric,
  href text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  (
    -- medicines
    SELECT
      'medicine'::text,
      m.id,
      m.name,
      COALESCE(m.brand, m.form),
      m.image_url,
      m.price,
      '/medicines/' || m.id
    FROM medicines m
    WHERE TRIM(COALESCE(q, '')) <> '' 
      AND m.is_active = true
      AND (
        m.name ILIKE '%' || q || '%' OR
        COALESCE(m.brand, '') ILIKE '%' || q || '%' OR
        COALESCE(m.manufacturer, '') ILIKE '%' || q || '%' OR
        COALESCE(m.form, '') ILIKE '%' || q || '%'
      )
    ORDER BY similarity(m.name, q) DESC NULLS LAST
    LIMIT max_per_group
  )
  UNION ALL
  (
    -- doctors
    SELECT
      'doctor'::text,
      d.id,
      d.full_name,
      d.specialization,
      d.profile_image_url,
      d.consultation_fee,
      '/doctors/' || d.id
    FROM doctors d
    WHERE TRIM(COALESCE(q, '')) <> '' 
      AND d.is_available = true
      AND d.is_verified = true
      AND (
        d.full_name ILIKE '%' || q || '%' OR
        d.specialization ILIKE '%' || q || '%' OR
        COALESCE(d.hospital_affiliation, '') ILIKE '%' || q || '%'
      )
    ORDER BY similarity(d.full_name, q) DESC NULLS LAST
    LIMIT max_per_group
  )
  UNION ALL
  (
    -- lab tests
    SELECT
      'lab_test'::text,
      l.id,
      l.name,
      COALESCE(l.category, l.sample_type),
      l.image_url,
      l.price,
      '/lab-tests/' || l.id
    FROM lab_tests l
    WHERE TRIM(COALESCE(q, '')) <> '' 
      AND l.is_active = true
      AND (
        l.name ILIKE '%' || q || '%' OR
        COALESCE(l.category, '') ILIKE '%' || q || '%' OR
        COALESCE(l.sample_type, '') ILIKE '%' || q || '%'
      )
    ORDER BY similarity(l.name, q) DESC NULLS LAST
    LIMIT max_per_group
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.universal_search(text, int) TO anon, authenticated;