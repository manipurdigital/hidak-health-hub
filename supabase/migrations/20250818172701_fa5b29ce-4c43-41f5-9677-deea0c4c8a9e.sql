-- Enable PostGIS extension
create extension if not exists postgis;

-- Create service_areas table if missing
create table if not exists service_areas (
  id uuid primary key default gen_random_uuid(),
  center_type text check (center_type in ('lab','delivery')) not null,
  center_id uuid not null,
  name text not null,
  color text default '#22c55e',
  active boolean default true,
  priority int default 0,
  capacity_per_day int default 0,
  working_hours jsonb default '{}'::jsonb, -- { "mon":[["08:00","18:00"]], ... }
  geom geography,    -- Polygon or buffered circle
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for performance
create index if not exists idx_service_areas_geom on service_areas using gist(geom);
create index if not exists idx_service_areas_center on service_areas(center_type, center_id, active);

-- Enable Row Level Security
alter table service_areas enable row level security;

-- RLS Policies

-- Admins: full CRUD on service_areas
create policy "Admins can manage all service areas"
on service_areas
for all
using (has_role(auth.uid(), 'admin'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role));

-- Center staff: read only for their own center's service areas
create policy "Center staff can view their center's service areas"
on service_areas
for select
using (
  active = true and
  (
    -- Lab center staff can view lab service areas for their center
    (center_type = 'lab' and exists (
      select 1 from center_staff cs 
      where cs.user_id = auth.uid() 
        and cs.center_id = service_areas.center_id 
        and cs.is_active = true
    ))
    or
    -- Delivery center staff can view delivery service areas for their store
    (center_type = 'delivery' and exists (
      select 1 from center_staff cs 
      where cs.user_id = auth.uid() 
        and cs.center_id = service_areas.center_id 
        and cs.is_active = true
    ))
  )
);

-- Function to check if a point is within any active service area
create or replace function check_point_serviceability_new(
  lat numeric, 
  lng numeric, 
  service_center_type text
)
returns table(
  service_area_id uuid,
  center_id uuid,
  name text,
  priority integer,
  capacity_per_day integer
)
language plpgsql
stable security definer
as $$
begin
  return query
  select 
    sa.id,
    sa.center_id,
    sa.name,
    sa.priority,
    sa.capacity_per_day
  from service_areas sa
  where sa.center_type = service_center_type
    and sa.active = true
    and sa.geom is not null
    and st_contains(
      sa.geom::geometry,
      st_point(lng, lat)::geometry
    )
  order by sa.priority desc, sa.created_at asc;
end;
$$;