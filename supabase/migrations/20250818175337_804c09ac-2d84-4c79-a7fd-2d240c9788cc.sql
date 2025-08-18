-- Enhanced assignment functions with working hours and capacity validation

-- Helper function to check if current time is within working hours
create or replace function public.is_within_working_hours(
  working_hours jsonb,
  check_time timestamp with time zone default now()
)
returns boolean
language plpgsql
immutable
as $$
declare
  day_of_week int;
  current_time time;
  day_schedule jsonb;
  start_time text;
  end_time text;
begin
  -- Get day of week (0 = Sunday, 1 = Monday, etc.)
  day_of_week := extract(dow from check_time);
  current_time := check_time::time;
  
  -- If working_hours is null or empty, assume always open
  if working_hours is null or working_hours = '{}'::jsonb then
    return true;
  end if;
  
  -- Get schedule for current day
  day_schedule := working_hours->day_of_week::text;
  
  -- If no schedule for this day, assume closed
  if day_schedule is null then
    return false;
  end if;
  
  -- Check if day is marked as closed
  if (day_schedule->>'closed')::boolean = true then
    return false;
  end if;
  
  -- Get start and end times
  start_time := day_schedule->>'start';
  end_time := day_schedule->>'end';
  
  -- If no start/end times, assume closed
  if start_time is null or end_time is null then
    return false;
  end if;
  
  -- Check if current time is within working hours
  return current_time between start_time::time and end_time::time;
end;
$$;

-- Helper function to get current daily job count for a center
create or replace function public.get_daily_job_count(
  center_id_param uuid,
  center_type_param text,
  check_date date default current_date
)
returns integer
language sql
stable
as $$
  select coalesce(
    case 
      when center_type_param = 'lab' then (
        select count(*)::integer
        from lab_bookings lb
        where lb.center_id = center_id_param
          and lb.booking_date = check_date
          and lb.status not in ('cancelled')
      )
      when center_type_param = 'delivery' then (
        select count(*)::integer  
        from orders o
        where o.delivery_center_id = center_id_param
          and o.created_at::date = check_date
          and o.status not in ('cancelled')
      )
      else 0
    end, 0
  );
$$;

-- Enhanced serviceable centers with working hours and capacity validation
create or replace function public.serviceable_centers_with_validation(
  in_type text,
  in_lat double precision,
  in_lng double precision,
  check_time timestamp with time zone default now()
)
returns table(
  center_id uuid, 
  center_type text, 
  area_id uuid, 
  priority int, 
  distance_m double precision,
  is_open boolean,
  current_load integer,
  capacity_available boolean,
  rejection_reason text
)
language sql
security definer
stable
set search_path = public
as $$
  with pt as (
    select ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography g
  ),
  basic_serviceable as (
    select 
      sa.center_id,
      sa.center_type,
      sa.id as area_id,
      sa.priority,
      ST_Distance(sa.geom, (select g from pt)) as distance_m,
      sa.working_hours,
      sa.capacity_per_day
    from service_areas sa
    where sa.active = true
      and sa.center_type = in_type
      and ST_Intersects(sa.geom, (select g from pt))
  )
  select 
    bs.center_id,
    bs.center_type,
    bs.area_id,
    bs.priority,
    bs.distance_m,
    is_within_working_hours(bs.working_hours, check_time) as is_open,
    get_daily_job_count(bs.center_id, bs.center_type, check_time::date) as current_load,
    case 
      when bs.capacity_per_day <= 0 then true
      else get_daily_job_count(bs.center_id, bs.center_type, check_time::date) < bs.capacity_per_day
    end as capacity_available,
    case
      when not is_within_working_hours(bs.working_hours, check_time) then 'closed'
      when bs.capacity_per_day > 0 and get_daily_job_count(bs.center_id, bs.center_type, check_time::date) >= bs.capacity_per_day then 'capacity_full'
      else 'available'
    end as rejection_reason
  from basic_serviceable bs
  order by 
    -- Prioritize available centers first
    case when is_within_working_hours(bs.working_hours, check_time) 
         and (bs.capacity_per_day <= 0 or get_daily_job_count(bs.center_id, bs.center_type, check_time::date) < bs.capacity_per_day)
         then 0 else 1 end,
    bs.priority desc, 
    bs.distance_m asc;
$$;

-- Enhanced center selection with working hours and capacity validation
create or replace function public.pick_center_with_validation(
  in_type text,
  in_lat double precision,
  in_lng double precision,
  check_time timestamp with time zone default now(),
  allow_closed boolean default false
)
returns table(
  center_id uuid, 
  reason text, 
  is_open boolean,
  current_load integer,
  warnings text[]
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  available_center record;
  fallback_center record;
  warnings_array text[] := '{}';
begin
  -- First try to find an available center (open and within capacity)
  select sc.center_id, sc.center_type, sc.is_open, sc.current_load, sc.capacity_available, sc.rejection_reason
  into available_center
  from serviceable_centers_with_validation(in_type, in_lat, in_lng, check_time) sc
  where sc.is_open = true and sc.capacity_available = true
  limit 1;
  
  if found then
    return query select 
      available_center.center_id,
      'inside_geofence_available'::text,
      available_center.is_open,
      available_center.current_load,
      warnings_array;
    return;
  end if;
  
  -- If no available centers, try to find any center within geofence (even if closed/full)
  if allow_closed then
    select sc.center_id, sc.center_type, sc.is_open, sc.current_load, sc.capacity_available, sc.rejection_reason
    into available_center
    from serviceable_centers_with_validation(in_type, in_lat, in_lng, check_time) sc
    order by 
      case when sc.is_open then 0 else 1 end,
      case when sc.capacity_available then 0 else 1 end,
      sc.priority desc,
      sc.distance_m asc
    limit 1;
    
    if found then
      -- Add warnings based on the center's status
      if not available_center.is_open then
        warnings_array := warnings_array || 'Center is currently closed'::text;
      end if;
      
      if not available_center.capacity_available then
        warnings_array := warnings_array || 'Center has reached daily capacity'::text;
      end if;
      
      return query select 
        available_center.center_id,
        'inside_geofence_with_issues'::text,
        available_center.is_open,
        available_center.current_load,
        warnings_array;
      return;
    end if;
  end if;
  
  -- Fallback to nearest center within 7km
  with pt as (
    select ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography g
  )
  select 
    sa.center_id,
    is_within_working_hours(sa.working_hours, check_time) as is_open,
    get_daily_job_count(sa.center_id, sa.center_type, check_time::date) as current_load,
    case 
      when sa.capacity_per_day <= 0 then true
      else get_daily_job_count(sa.center_id, sa.center_type, check_time::date) < sa.capacity_per_day
    end as capacity_available
  into fallback_center
  from service_areas sa, pt
  where sa.active = true 
    and sa.center_type = in_type
    and ST_Distance(sa.geom, pt.g) <= 7000
    and (allow_closed or (
      is_within_working_hours(sa.working_hours, check_time) and 
      (sa.capacity_per_day <= 0 or get_daily_job_count(sa.center_id, sa.center_type, check_time::date) < sa.capacity_per_day)
    ))
  order by ST_Distance(sa.geom, pt.g) asc
  limit 1;
  
  if found then
    warnings_array := warnings_array || 'Using fallback center (outside geofence)'::text;
    
    if not fallback_center.is_open then
      warnings_array := warnings_array || 'Fallback center is currently closed'::text;
    end if;
    
    if not fallback_center.capacity_available then
      warnings_array := warnings_array || 'Fallback center has reached daily capacity'::text;
    end if;
    
    return query select 
      fallback_center.center_id,
      'nearest_fallback'::text,
      fallback_center.is_open,
      fallback_center.current_load,
      warnings_array;
    return;
  end if;
  
  -- No suitable center found
  return query select 
    null::uuid,
    'no_center_available'::text,
    false,
    0,
    array['No suitable centers found']::text[];
end;
$$;

-- Update the main pick_center_for_job to use validation by default
create or replace function public.pick_center_for_job(
  in_type text,
  in_lat double precision,
  in_lng double precision
)
returns table(center_id uuid, reason text)
language sql
security definer
stable
set search_path = public
as $$
  select pcwv.center_id, pcwv.reason
  from pick_center_with_validation(in_type, in_lat, in_lng, now(), false) pcwv;
$$;

-- Enhanced function that includes load balancing with validation
create or replace function public.pick_center_with_load_balancing_and_validation(
  in_type text,
  in_lat double precision,
  in_lng double precision,
  check_time timestamp with time zone default now()
)
returns table(
  center_id uuid, 
  reason text, 
  current_load bigint,
  is_open boolean,
  warnings text[]
)
language sql
security definer
stable
set search_path = public
as $$
  with available_centers as (
    select 
      sc.center_id,
      sc.is_open,
      sc.current_load,
      sc.capacity_available,
      sc.priority,
      sc.distance_m,
      sc.rejection_reason
    from serviceable_centers_with_validation(in_type, in_lat, in_lng, check_time) sc
    where sc.is_open = true and sc.capacity_available = true
  ),
  best_center as (
    select 
      ac.center_id,
      ac.current_load,
      ac.is_open
    from available_centers ac
    order by 
      ac.priority desc,
      ac.current_load asc,
      ac.distance_m asc
    limit 1
  )
  select 
    bc.center_id,
    'load_balanced_assignment'::text as reason,
    bc.current_load,
    bc.is_open,
    case when bc.center_id is not null then array[]::text[] else array['No available centers with capacity']::text[] end as warnings
  from best_center bc
  
  union all
  
  -- Fallback if no available centers
  select 
    pcwv.center_id,
    pcwv.reason,
    pcwv.current_load::bigint,
    pcwv.is_open,
    pcwv.warnings
  from pick_center_with_validation(in_type, in_lat, in_lng, check_time, true) pcwv
  where not exists (select 1 from best_center where center_id is not null)
  
  limit 1;
$$;