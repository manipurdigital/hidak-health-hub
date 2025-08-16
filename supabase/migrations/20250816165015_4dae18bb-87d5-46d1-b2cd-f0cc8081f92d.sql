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
  WITH needle AS (SELECT trim(coalesce(q, '')) AS q)

  -- medicines
  SELECT
    'medicine'::text,
    m.id,
    m.name,
    COALESCE(m.brand, m.form),
    m.image_url,
    m.price,
    '/medicines/' || m.id
  FROM medicines m, needle n
  WHERE n.q <> '' 
    AND m.is_active = true
    AND (
      m.name ILIKE '%' || n.q || '%' OR
      COALESCE(m.brand, '') ILIKE '%' || n.q || '%' OR
      COALESCE(m.manufacturer, '') ILIKE '%' || n.q || '%' OR
      COALESCE(m.form, '') ILIKE '%' || n.q || '%'
    )
  ORDER BY similarity(m.name, n.q) DESC NULLS LAST
  LIMIT max_per_group

  UNION ALL

  -- doctors
  SELECT
    'doctor'::text,
    d.id,
    d.full_name,
    d.specialization,
    d.profile_image_url,
    d.consultation_fee,
    '/doctors/' || d.id
  FROM doctors d, needle n
  WHERE n.q <> '' 
    AND d.is_available = true
    AND d.is_verified = true
    AND (
      d.full_name ILIKE '%' || n.q || '%' OR
      d.specialization ILIKE '%' || n.q || '%' OR
      COALESCE(d.hospital_affiliation, '') ILIKE '%' || n.q || '%'
    )
  ORDER BY similarity(d.full_name, n.q) DESC NULLS LAST
  LIMIT max_per_group

  UNION ALL

  -- lab tests
  SELECT
    'lab_test'::text,
    l.id,
    l.name,
    COALESCE(l.category, l.sample_type),
    l.image_url,
    l.price,
    '/lab-tests/' || l.id
  FROM lab_tests l, needle n
  WHERE n.q <> '' 
    AND l.is_active = true
    AND (
      l.name ILIKE '%' || n.q || '%' OR
      COALESCE(l.category, '') ILIKE '%' || n.q || '%' OR
      COALESCE(l.sample_type, '') ILIKE '%' || n.q || '%'
    )
  ORDER BY similarity(l.name, n.q) DESC NULLS LAST
  LIMIT max_per_group;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.universal_search(text, int) TO anon, authenticated;