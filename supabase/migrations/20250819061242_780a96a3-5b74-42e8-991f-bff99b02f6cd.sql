-- Create RLS audit function
CREATE OR REPLACE FUNCTION public.audit_rls()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  has_default_deny BOOLEAN,
  policy_count INTEGER,
  permissive_policies INTEGER,
  issues TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  policy_rec RECORD;
  issues_array TEXT[];
  permissive_count INTEGER;
  total_policies INTEGER;
  has_deny BOOLEAN;
BEGIN
  -- Check custom tables that should have RLS
  FOR rec IN 
    SELECT t.table_name as tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
      'medicines', 'lab_tests', 'orders', 'lab_bookings', 'courier_locations',
      'service_areas', 'import_jobs', 'import_job_items', 'notifications',
      'diagnostic_centers', 'center_staff', 'profiles', 'addresses', 'carts',
      'consultations', 'consultation_messages', 'prescriptions', 'doctors',
      'doctor_availability', 'geofences', 'stores', 'order_items'
    )
  LOOP
    issues_array := ARRAY[]::TEXT[];
    permissive_count := 0;
    total_policies := 0;
    has_deny := FALSE;
    
    -- Check if RLS is enabled
    SELECT c.relrowsecurity INTO STRICT rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = rec.tname;
    
    IF NOT rls_enabled THEN
      issues_array := array_append(issues_array, 'RLS not enabled');
    END IF;
    
    -- Count policies and check for permissive ones
    FOR policy_rec IN
      SELECT pol.polname, pol.polpermissive, pol.polcmd
      FROM pg_policy pol
      JOIN pg_class c ON pol.polrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relname = rec.tname
    LOOP
      total_policies := total_policies + 1;
      
      IF policy_rec.polpermissive THEN
        permissive_count := permissive_count + 1;
      END IF;
      
      -- Check for default deny pattern
      IF policy_rec.polname ILIKE '%deny%' OR policy_rec.polname ILIKE '%default%' THEN
        has_deny := TRUE;
      END IF;
    END LOOP;
    
    -- Check for missing default deny
    IF total_policies > 0 AND NOT has_deny THEN
      issues_array := array_append(issues_array, 'No default deny policy found');
    END IF;
    
    -- Check for too many permissive policies
    IF permissive_count > (total_policies * 0.8) THEN
      issues_array := array_append(issues_array, 'Too many permissive policies');
    END IF;
    
    -- Return the audit result
    table_name := rec.tname;
    has_default_deny := has_deny;
    policy_count := total_policies;
    permissive_policies := permissive_count;
    issues := issues_array;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Create function to apply RLS fixes
CREATE OR REPLACE FUNCTION public.apply_rls_fixes()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fix_count INTEGER := 0;
  table_rec RECORD;
BEGIN
  -- Only allow admins to run this
  IF NOT has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Enable RLS on all required tables
  FOR table_rec IN
    SELECT table_name as tname FROM audit_rls() WHERE NOT rls_enabled
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_rec.tname);
    fix_count := fix_count + 1;
  END LOOP;
  
  -- Add default deny policies where missing
  -- medicines
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.medicines;
    CREATE POLICY "Default deny all" ON public.medicines FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- lab_tests  
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.lab_tests;
    CREATE POLICY "Default deny all" ON public.lab_tests FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- orders
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.orders;
    CREATE POLICY "Default deny all" ON public.orders FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- lab_bookings
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.lab_bookings;
    CREATE POLICY "Default deny all" ON public.lab_bookings FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- courier_locations
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.courier_locations;
    CREATE POLICY "Default deny all" ON public.courier_locations FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- service_areas
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.service_areas;
    CREATE POLICY "Default deny all" ON public.service_areas FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- import_jobs
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.import_jobs;
    CREATE POLICY "Default deny all" ON public.import_jobs FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- import_job_items
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.import_job_items;
    CREATE POLICY "Default deny all" ON public.import_job_items FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- notifications
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.notifications;
    CREATE POLICY "Default deny all" ON public.notifications FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- diagnostic_centers
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.diagnostic_centers;
    CREATE POLICY "Default deny all" ON public.diagnostic_centers FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  -- center_staff
  BEGIN
    DROP POLICY IF EXISTS "Default deny all" ON public.center_staff;
    CREATE POLICY "Default deny all" ON public.center_staff FOR ALL USING (FALSE);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
  END;
  
  RETURN format('Applied RLS fixes to %s tables', fix_count);
END;
$$;