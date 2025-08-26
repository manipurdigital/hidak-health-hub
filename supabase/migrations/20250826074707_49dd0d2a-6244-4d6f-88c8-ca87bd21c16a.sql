
-- 1) Tighten center scoping on lab_bookings for SELECT/UPDATE via restrictive policies
-- These combine with existing policies to ensure center staff only see/update rows assigned to their center(s)

create policy "center can select only assigned lab bookings"
on public.lab_bookings
for select
as restrictive
using (
  center_id is not null
  and center_id in (
    select cs.center_id
    from public.center_staff cs
    where cs.user_id = auth.uid()
      and cs.is_active = true
  )
);

create policy "center can update only assigned lab bookings"
on public.lab_bookings
for update
as restrictive
using (
  center_id is not null
  and center_id in (
    select cs.center_id
    from public.center_staff cs
    where cs.user_id = auth.uid()
      and cs.is_active = true
  )
)
with check (
  center_id is not null
  and center_id in (
    select cs.center_id
    from public.center_staff cs
    where cs.user_id = auth.uid()
      and cs.is_active = true
  )
);

-- 2) Auto-compute center payout amount when status becomes 'collected'
create or replace function public.set_lab_booking_payout_amount()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'collected'
     and (coalesce(old.status, '') <> 'collected' or new.center_payout_amount is null) then
    new.center_payout_amount := coalesce(
      new.center_payout_amount,
      round(coalesce(new.total_amount, 0) * coalesce(new.center_payout_rate, 0.30), 2)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_lab_booking_payout on public.lab_bookings;

create trigger trg_set_lab_booking_payout
before insert or update of status, total_amount, center_payout_rate
on public.lab_bookings
for each row
execute function public.set_lab_booking_payout_amount();

-- 3) Payout tables: batches and items
create table if not exists public.lab_payout_batches (
  id uuid primary key default gen_random_uuid(),
  center_id uuid not null,
  status text not null default 'pending', -- pending | paid
  total_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid null,
  paid_at timestamptz null,
  reference text null,
  notes text null
);

create table if not exists public.lab_payout_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.lab_payout_batches(id) on delete cascade,
  booking_id uuid not null references public.lab_bookings(id) on delete restrict,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (booking_id)
);

alter table public.lab_payout_batches enable row level security;
alter table public.lab_payout_items enable row level security;

-- Admin can manage payout batches
create policy lab_payout_batches_admin_all
on public.lab_payout_batches
for all
using (public.has_role('admin'::text))
with check (public.has_role('admin'::text));

-- Center can view their own payout batches
create policy lab_payout_batches_center_select
on public.lab_payout_batches
for select
to authenticated
using (
  center_id in (
    select cs.center_id
    from public.center_staff cs
    where cs.user_id = auth.uid()
      and cs.is_active = true
  )
);

-- Admin can manage payout items
create policy lab_payout_items_admin_all
on public.lab_payout_items
for all
using (public.has_role('admin'::text))
with check (public.has_role('admin'::text));

-- Center can view payout items for their batches
create policy lab_payout_items_center_select
on public.lab_payout_items
for select
to authenticated
using (
  exists (
    select 1
    from public.lab_payout_batches b
    where b.id = lab_payout_items.batch_id
      and b.center_id in (
        select cs.center_id
        from public.center_staff cs
        where cs.user_id = auth.uid()
          and cs.is_active = true
      )
  )
);

-- 4) Admin RPCs to create and mark payouts
create or replace function public.admin_create_lab_payout_batch(
  p_center_id uuid,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
begin
  -- Admin auth
  if not public.has_role('admin'::text) and not public.has_admin_access(auth.uid()) then
    raise exception 'forbidden';
  end if;

  -- Create batch
  insert into public.lab_payout_batches (center_id, status, total_amount, created_by)
  values (p_center_id, 'pending', 0, auth.uid())
  returning id into v_batch_id;

  -- Add eligible items: collected bookings for center in date range, not already paid
  insert into public.lab_payout_items (batch_id, booking_id, amount)
  select
    v_batch_id,
    lb.id,
    coalesce(
      lb.center_payout_amount,
      round(lb.total_amount * coalesce(lb.center_payout_rate, 0.30), 2)
    )
  from public.lab_bookings lb
  where lb.center_id = p_center_id
    and lb.status = 'collected'
    and lb.booking_date >= p_start_date
    and lb.booking_date <= p_end_date
    and not exists (
      select 1 from public.lab_payout_items pi where pi.booking_id = lb.id
    );

  -- Update batch total
  update public.lab_payout_batches b
  set total_amount = coalesce((
    select sum(amount) from public.lab_payout_items where batch_id = v_batch_id
  ), 0)
  where b.id = v_batch_id;

  return v_batch_id;
end;
$$;

create or replace function public.admin_mark_lab_payout_paid(
  p_batch_id uuid,
  p_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admin auth
  if not public.has_role('admin'::text) and not public.has_admin_access(auth.uid()) then
    raise exception 'forbidden';
  end if;

  update public.lab_payout_batches
  set status = 'paid',
      paid_at = now(),
      reference = coalesce(p_reference, reference),
      notes = coalesce(p_notes, notes)
  where id = p_batch_id;
end;
$$;
