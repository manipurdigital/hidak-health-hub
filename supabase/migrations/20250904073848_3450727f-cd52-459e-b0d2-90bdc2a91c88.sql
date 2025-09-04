-- Enable RLS on any tables that might be missing it (this migration is idempotent)

-- Check and enable RLS on spatial_ref_sys table if it exists and RLS is disabled
DO $$
BEGIN
  -- Enable RLS on spatial_ref_sys if it exists and doesn't have RLS enabled
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'spatial_ref_sys'
  ) THEN
    -- Check if RLS is already enabled
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
      AND c.relname = 'spatial_ref_sys'
      AND c.relrowsecurity = true
    ) THEN
      ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
      
      -- Create a permissive policy for reading spatial reference data
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'spatial_ref_sys' 
        AND policyname = 'Allow read access to spatial_ref_sys'
      ) THEN
        CREATE POLICY "Allow read access to spatial_ref_sys" 
        ON public.spatial_ref_sys 
        FOR SELECT 
        USING (true);
      END IF;
    END IF;
  END IF;
END$$;