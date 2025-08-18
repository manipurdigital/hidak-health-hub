-- Function to create a new service area with geometry
create or replace function create_service_area_with_geom(
  area_data jsonb,
  geom_sql text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  -- Generate new ID
  new_id := gen_random_uuid();
  
  -- Execute dynamic SQL to insert with geometry
  execute format(
    'INSERT INTO service_areas (id, center_type, center_id, name, color, active, priority, capacity_per_day, working_hours, geom) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, %s) 
     RETURNING id',
    geom_sql
  ) using 
    new_id,
    (area_data->>'center_type')::text,
    (area_data->>'center_id')::uuid,
    (area_data->>'name')::text,
    (area_data->>'color')::text,
    (area_data->>'active')::boolean,
    (area_data->>'priority')::integer,
    (area_data->>'capacity_per_day')::integer,
    area_data->'working_hours';
    
  return new_id;
end;
$$;

-- Function to update service area with new geometry
create or replace function update_service_area_geom(
  area_id uuid,
  new_geom text,
  area_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Execute dynamic SQL to update with geometry
  execute format(
    'UPDATE service_areas 
     SET center_type = $2,
         center_id = $3,
         name = $4,
         color = $5,
         active = $6,
         priority = $7,
         capacity_per_day = $8,
         working_hours = $9,
         geom = %s,
         updated_at = now()
     WHERE id = $1',
    new_geom
  ) using 
    area_id,
    (area_data->>'center_type')::text,
    (area_data->>'center_id')::uuid,
    (area_data->>'name')::text,
    (area_data->>'color')::text,
    (area_data->>'active')::boolean,
    (area_data->>'priority')::integer,
    (area_data->>'capacity_per_day')::integer,
    area_data->'working_hours';
    
  return area_id;
end;
$$;

-- Function to test if a point is within any active service area
create or replace function test_point_serviceability(
  lat numeric, 
  lng numeric, 
  service_center_type text
)
returns table(
  service_area_id uuid,
  center_id uuid,
  name text,
  priority integer,
  capacity_per_day integer,
  is_within boolean
)
language plpgsql
stable security definer
set search_path = public
as $$
begin
  return query
  select 
    sa.id,
    sa.center_id,
    sa.name,
    sa.priority,
    sa.capacity_per_day,
    st_contains(sa.geom::geometry, st_point(lng, lat)::geometry) as is_within
  from service_areas sa
  where sa.center_type = service_center_type
    and sa.active = true
    and sa.geom is not null
  order by sa.priority desc, sa.created_at asc;
end;
$$;