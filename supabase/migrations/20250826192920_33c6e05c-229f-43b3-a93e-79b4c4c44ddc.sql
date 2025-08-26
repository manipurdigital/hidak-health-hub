
-- Secure admin function to link an existing auth user to a doctor profile by email
-- and assign the 'doctor' role. Runs with SECURITY DEFINER and checks admin access.

create or replace function public.admin_link_doctor_account(
  p_doctor_id uuid,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  -- Ensure only admins can use this
  if not public.has_admin_access() then
    raise exception 'forbidden';
  end if;

  -- Find the auth user by email (case-insensitive)
  select u.id
    into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'user_not_found';
  end if;

  -- Link the doctor to this user_id if not already linked to another user
  update public.doctors d
     set user_id = v_user_id
   where d.id = p_doctor_id
     and (d.user_id is null or d.user_id = v_user_id);

  if not found then
    -- Either the doctor does not exist or is already linked to a different user
    raise exception 'doctor_update_failed';
  end if;

  -- Ensure the user has the doctor role
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'doctor'::app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

-- Allow authenticated clients (our app users) to call it; RLS is bypassed by SECURITY DEFINER
grant execute on function public.admin_link_doctor_account(uuid, text) to authenticated;
