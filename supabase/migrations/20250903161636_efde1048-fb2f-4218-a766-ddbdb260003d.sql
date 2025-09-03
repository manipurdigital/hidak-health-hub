-- Create RPC to link existing auth user by email to a doctor profile
CREATE OR REPLACE FUNCTION public.admin_link_doctor_account(p_doctor_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Allow only admins to perform this action
  IF get_current_user_role() <> 'admin'::app_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Find user by email in auth schema
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  -- Link the doctor to this user (only if currently unlinked or same user)
  UPDATE public.doctors
  SET user_id = target_user_id
  WHERE id = p_doctor_id
    AND (user_id IS NULL OR user_id = target_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'doctor_update_failed';
  END IF;

  -- Ensure the user has a doctor role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'doctor'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;