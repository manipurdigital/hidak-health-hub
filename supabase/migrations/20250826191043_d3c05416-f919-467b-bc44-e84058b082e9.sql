-- Fix RLS issue - add missing RLS policy for spatial_ref_sys table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Add policy for spatial_ref_sys (this is a PostGIS system table that should be readable)
CREATE POLICY "spatial_ref_sys_readable" ON public.spatial_ref_sys FOR SELECT USING (true);