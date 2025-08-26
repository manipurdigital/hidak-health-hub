-- Drop existing admin policy first
DROP POLICY IF EXISTS "Admin can manage riders" ON public.riders;

-- RLS policies for riders table

-- Admins manage all riders
CREATE POLICY riders_admin_all ON public.riders
  AS PERMISSIVE FOR ALL 
  USING (public.is_admin_claim()) 
  WITH CHECK (public.is_admin_claim());

-- Rider can read their own record (by user_id if it exists)
-- Note: Only add rider self policies if user_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'riders' 
    AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY rider_self ON public.riders FOR SELECT USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY rider_self_update ON public.riders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;