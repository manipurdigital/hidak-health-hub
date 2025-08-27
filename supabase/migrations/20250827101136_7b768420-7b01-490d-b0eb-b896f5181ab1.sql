-- Add RPC function for admin to link user accounts to diagnostic centers
CREATE OR REPLACE FUNCTION public.admin_link_center_account_by_email(
  p_center_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'center'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  center_exists BOOLEAN;
BEGIN
  -- Check if user has admin access
  IF NOT has_admin_access() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Validate role
  IF p_role NOT IN ('center', 'center_staff') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  -- Check if center exists
  SELECT EXISTS(
    SELECT 1 FROM diagnostic_centers 
    WHERE id = p_center_id
  ) INTO center_exists;
  
  IF NOT center_exists THEN
    RAISE EXCEPTION 'center_not_found';
  END IF;

  -- Find user by email
  SELECT p.user_id INTO target_user_id
  FROM profiles p
  WHERE p.email = p_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Insert or update center staff relationship
  INSERT INTO center_staff (user_id, center_id, role, is_active)
  VALUES (target_user_id, p_center_id, p_role, true)
  ON CONFLICT (user_id, center_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();
END;
$$;