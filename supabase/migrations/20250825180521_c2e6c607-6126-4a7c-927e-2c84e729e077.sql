-- Fix ambiguous function overloading causing "function public.is_admin() is not unique"
-- Remove default from the 1-arg variant so it cannot be called with zero args
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Keep the zero-arg helper for convenience; ensure it calls the 1-arg explicitly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.is_admin(auth.uid());
$$;