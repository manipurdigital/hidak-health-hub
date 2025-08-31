-- Fix medicines table and RLS policies
-- First ensure all required columns exist with proper defaults
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS requires_prescription boolean DEFAULT false;

-- Update the RLS policies for medicines to be more permissive for admins
DROP POLICY IF EXISTS "Admins can manage medicines" ON public.medicines;
DROP POLICY IF EXISTS "Anyone can view available medicines" ON public.medicines;

-- Create new RLS policies
CREATE POLICY "Admins can manage all medicines" 
ON public.medicines 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Anyone can view available medicines" 
ON public.medicines 
FOR SELECT 
USING (is_available = true);

-- Fix medicine_categories table RLS
DROP POLICY IF EXISTS "Admins can manage medicine categories" ON public.medicine_categories;
DROP POLICY IF EXISTS "Anyone can view medicine categories" ON public.medicine_categories;

CREATE POLICY "Admins can manage all medicine categories" 
ON public.medicine_categories 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Anyone can view medicine categories" 
ON public.medicine_categories 
FOR SELECT 
USING (true);

-- Fix lab_tests table RLS  
DROP POLICY IF EXISTS "Admins can manage lab tests" ON public.lab_tests;
DROP POLICY IF EXISTS "Anyone can view available lab tests" ON public.lab_tests;

CREATE POLICY "Admins can manage all lab tests" 
ON public.lab_tests 
FOR ALL 
USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Anyone can view available lab tests" 
ON public.lab_tests 
FOR SELECT 
USING (is_available = true);

-- Ensure the universal_search function works properly
CREATE OR REPLACE FUNCTION public.universal_search(query_text text, limit_count integer DEFAULT 20)
RETURNS TABLE(
    type text, 
    id text, 
    title text, 
    subtitle text, 
    thumbnail_url text, 
    price numeric, 
    href text, 
    group_key text, 
    is_alternative boolean, 
    composition_match_type text, 
    composition_key text, 
    composition_family_key text, 
    rank_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH medicine_results AS (
        SELECT 
            'medicine'::text as type,
            m.id::text,
            m.name as title,
            COALESCE(m.manufacturer, '') as subtitle,
            m.thumbnail_url,
            m.price,
            ('/medicine/' || m.id) as href,
            COALESCE(m.composition_key, '') as group_key,
            false as is_alternative,
            'exact' as composition_match_type,
            COALESCE(m.composition_key, '') as composition_key,
            COALESCE(m.composition_family_key, '') as composition_family_key,
            CASE 
                WHEN m.name ILIKE query_text || '%' THEN 3.0
                WHEN m.name ILIKE '%' || query_text || '%' THEN 2.0
                WHEN m.generic_name ILIKE '%' || query_text || '%' THEN 1.5
                ELSE 1.0
            END as rank_score
        FROM medicines m
        WHERE m.is_available = true 
        AND m.is_active = true
        AND (
            m.name ILIKE '%' || query_text || '%' 
            OR m.generic_name ILIKE '%' || query_text || '%'
            OR m.manufacturer ILIKE '%' || query_text || '%'
        )
    ),
    doctor_results AS (
        SELECT 
            'doctor'::text as type,
            d.id::text,
            COALESCE(d.name, d.full_name, '') as title,
            COALESCE(d.specialization, '') as subtitle,
            d.profile_image_url as thumbnail_url,
            d.consultation_fee as price,
            ('/doctor/' || d.id) as href,
            COALESCE(d.specialization, '') as group_key,
            false as is_alternative,
            'exact' as composition_match_type,
            '' as composition_key,
            '' as composition_family_key,
            CASE 
                WHEN d.name ILIKE query_text || '%' THEN 3.0
                WHEN d.specialization ILIKE '%' || query_text || '%' THEN 2.0
                ELSE 1.0
            END as rank_score
        FROM doctors d
        WHERE d.is_available = true 
        AND d.is_verified = true
        AND (
            d.name ILIKE '%' || query_text || '%' 
            OR d.full_name ILIKE '%' || query_text || '%'
            OR d.specialization ILIKE '%' || query_text || '%'
        )
    ),
    lab_test_results AS (
        SELECT 
            'lab_test'::text as type,
            lt.id::text,
            lt.name as title,
            COALESCE(lt.category, '') as subtitle,
            ''::text as thumbnail_url,
            lt.price,
            ('/lab-test/' || lt.id) as href,
            COALESCE(lt.category, '') as group_key,
            false as is_alternative,
            'exact' as composition_match_type,
            '' as composition_key,
            '' as composition_family_key,
            CASE 
                WHEN lt.name ILIKE query_text || '%' THEN 3.0
                WHEN lt.name ILIKE '%' || query_text || '%' THEN 2.0
                ELSE 1.0
            END as rank_score
        FROM lab_tests lt
        WHERE lt.is_available = true 
        AND lt.is_active = true
        AND lt.name ILIKE '%' || query_text || '%'
    )
    SELECT * FROM medicine_results
    UNION ALL
    SELECT * FROM doctor_results  
    UNION ALL
    SELECT * FROM lab_test_results
    ORDER BY rank_score DESC, title
    LIMIT limit_count;
END;
$$;