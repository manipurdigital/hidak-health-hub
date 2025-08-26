-- Helper function to check if user has admin role from JWT claim
CREATE OR REPLACE FUNCTION public.is_admin_claim() 
RETURNS BOOLEAN
LANGUAGE SQL 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', '') = 'admin'
$$;