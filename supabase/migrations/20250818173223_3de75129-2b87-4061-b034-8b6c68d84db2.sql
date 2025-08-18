-- Check if a point is inside any active geofence (by module)
create or replace function public.serviceable_centers(
  in_type text,       -- 'lab' | 'delivery'
  in_lat double precision,
  in_lng double precision
)
returns table(center_id uuid, center_type text, area_id uuid, priority int, distance_m double precision)
language sql 
security definer 
stable
set search_path = public
as $$
  with pt as (
    select ST_SetSRID(ST_MakePoint(in_lng, in_lat),4326)::geography g
  )
  select sa.center_id, sa.center_type, sa.id as area_id, sa.priority,
         ST_Distance(sa.geom, (select g from pt)) as distance_m
  from service_areas sa
  where sa.active = true
    and sa.center_type = in_type
    and ST_Intersects(sa.geom, (select g from pt))
  order by sa.priority desc, distance_m asc;
$$;

-- Choose the best center (inside geofence; fallback nearest within 7km)
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
  with inside as (
    select center_id from serviceable_centers(in_type, in_lat, in_lng) limit 1
  ),
  fallback as (
    select sa.center_id
    from service_areas sa,
         (select ST_SetSRID(ST_MakePoint(in_lng,in_lat),4326)::geography g) p
    where sa.active = true and sa.center_type = in_type
      and ST_Distance(sa.geom, p.g) <= 7000  -- within 7km fallback
    order by ST_Distance(sa.geom, p.g) asc
    limit 1
  )
  select coalesce((select center_id from inside), (select center_id from fallback)) as center_id,
         case 
           when (select center_id from inside) is not null then 'inside_geofence' 
           when (select center_id from fallback) is not null then 'nearest_fallback'
           else 'no_service_available'
         end as reason;
$$;

-- Enhanced version that considers current workload for tie-breaking
create or replace function public.pick_center_with_load_balancing(
  in_type text,
  in_lat double precision,
  in_lng double precision
)
returns table(center_id uuid, reason text, current_load bigint)
language sql 
security definer 
stable
set search_path = public
as $$
  with serviceable as (
    select sc.center_id, sc.priority, sc.distance_m
    from serviceable_centers(in_type, in_lat, in_lng) sc
  ),
  with_load as (
    select 
      s.center_id,
      s.priority,
      s.distance_m,
      coalesce(
        case 
          when in_type = 'lab' then (
            select count(*) 
            from lab_bookings lb 
            where lb.center_id = s.center_id 
              and lb.booking_date = current_date 
              and lb.status in ('pending', 'assigned', 'en_route')
          )
          when in_type = 'delivery' then (
            select count(*) 
            from orders o 
            where o.delivery_center_id = s.center_id 
              and o.created_at::date = current_date 
              and o.status in ('pending', 'processing', 'packed', 'out_for_delivery')
          )
        end, 0
      ) as current_load
    from serviceable s
  ),
  best_inside as (
    select center_id, current_load
    from with_load
    order by priority desc, current_load asc, distance_m asc
    limit 1
  ),
  fallback as (
    select sa.center_id,
           coalesce(
             case 
               when in_type = 'lab' then (
                 select count(*) 
                 from lab_bookings lb 
                 where lb.center_id = sa.center_id 
                   and lb.booking_date = current_date 
                   and lb.status in ('pending', 'assigned', 'en_route')
               )
               when in_type = 'delivery' then (
                 select count(*) 
                 from orders o 
                 where o.delivery_center_id = sa.center_id 
                   and o.created_at::date = current_date 
                   and o.status in ('pending', 'processing', 'packed', 'out_for_delivery')
               )
             end, 0
           ) as current_load,
           ST_Distance(sa.geom, ST_SetSRID(ST_MakePoint(in_lng,in_lat),4326)::geography) as distance_m
    from service_areas sa
    where sa.active = true 
      and sa.center_type = in_type
      and ST_Distance(sa.geom, ST_SetSRID(ST_MakePoint(in_lng,in_lat),4326)::geography) <= 7000
    order by current_load asc, distance_m asc
    limit 1
  )
  select 
    coalesce((select center_id from best_inside), (select center_id from fallback)) as center_id,
    case 
      when (select center_id from best_inside) is not null then 'inside_geofence_load_balanced' 
      when (select center_id from fallback) is not null then 'nearest_fallback_load_balanced'
      else 'no_service_available'
    end as reason,
    coalesce((select current_load from best_inside), (select current_load from fallback), 0) as current_load;
$$;

-- Quick serviceability check (boolean result)
create or replace function public.is_location_serviceable(
  in_type text,
  in_lat double precision,
  in_lng double precision
)
returns boolean
language sql 
security definer 
stable
set search_path = public
as $$
  select exists(
    select 1 
    from serviceable_centers(in_type, in_lat, in_lng)
    limit 1
  );
$$;

-- Get service area details for a point
create or replace function public.get_service_area_info(
  in_type text,
  in_lat double precision,
  in_lng double precision
)
returns table(
  area_id uuid,
  area_name text,
  center_id uuid,
  priority integer,
  capacity_per_day integer,
  working_hours jsonb,
  color text,
  distance_m double precision
)
language sql 
security definer 
stable
set search_path = public
as $$
  with pt as (
    select ST_SetSRID(ST_MakePoint(in_lng, in_lat),4326)::geography g
  )
  select 
    sa.id as area_id,
    sa.name as area_name,
    sa.center_id,
    sa.priority,
    sa.capacity_per_day,
    sa.working_hours,
    sa.color,
    ST_Distance(sa.geom, (select g from pt)) as distance_m
  from service_areas sa
  where sa.active = true
    and sa.center_type = in_type
    and ST_Intersects(sa.geom, (select g from pt))
  order by sa.priority desc, distance_m asc;
$$;