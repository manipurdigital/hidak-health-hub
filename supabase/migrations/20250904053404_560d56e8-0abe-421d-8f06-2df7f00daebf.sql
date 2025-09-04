-- Fix the critical RLS disabled error by enabling RLS on spatial_ref_sys table
-- This is a PostGIS extension table that often gets flagged

-- Enable RLS on spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for spatial_ref_sys since it's reference data
CREATE POLICY "Allow read access to spatial reference data"
ON public.spatial_ref_sys
FOR SELECT
TO authenticated, anon
USING (true);