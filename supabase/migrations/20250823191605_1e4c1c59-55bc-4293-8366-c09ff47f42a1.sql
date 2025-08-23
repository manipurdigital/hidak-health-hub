-- Enable RLS (safe if already enabled)
ALTER TABLE public.pharmacy_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon or authenticated) to submit pharmacy applications
CREATE POLICY "Public can submit pharmacy applications"
ON public.pharmacy_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Optional: allow authenticated users to view their own applications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'pharmacy_applications' 
      AND policyname = 'Users can view their own pharmacy applications'
  ) THEN
    CREATE POLICY "Users can view their own pharmacy applications"
    ON public.pharmacy_applications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;