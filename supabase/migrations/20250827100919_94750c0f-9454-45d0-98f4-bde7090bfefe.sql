
-- Link an existing auth user to a diagnostic center by email (mirrors doctor linking)
create or replace function public.admin_link_center_account_by_email(
  p_center_id uuid,
  p_email text,
  p_role text default 'center'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role text;
begin
  -- Ensure only admins can use this
  if not public.has_admin_access() then
    raise exception 'forbidden';
  end if;

  -- Validate email -> auth user
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'user_not_found';
  end if;

  -- Validate center exists
  if not exists (select 1 from public.diagnostic_centers where id = p_center_id) then
    raise exception 'center_not_found';
  end if;

  -- Normalize and validate role
  v_role := lower(coalesce(p_role, 'center'));
  if v_role not in ('center', 'center_staff') then
    raise exception 'invalid_role';
  end if;

  -- Remove previous center(center_staff) roles to avoid ambiguity
  delete from public.user_roles 
   where user_id = v_user_id 
     and role in ('center'::app_role, 'center_staff'::app_role);

  -- Remove existing center staff entries for this user (one center per user policy)
  delete from public.center_staff where user_id = v_user_id;

  -- Assign the requested center role
  insert into public.user_roles (user_id, role)
  values (v_user_id, v_role::app_role)
  on conflict (user_id, role) do nothing;

  -- Create/refresh the staff link; map to admin/staff in center_staff.role
  insert into public.center_staff (user_id, center_id, role, is_active)
  values (
    v_user_id,
    p_center_id,
    case when v_role = 'center' then 'admin' else 'staff' end,
    true
  )
  on conflict (user_id, center_id) do update
    set role = excluded.role,
        is_active = true,
        updated_at = now();
end;
$$;

-- Allow our app to call it (admin check happens inside the function)
grant execute on function public.admin_link_center_account_by_email(uuid, text, text) to authenticated;
