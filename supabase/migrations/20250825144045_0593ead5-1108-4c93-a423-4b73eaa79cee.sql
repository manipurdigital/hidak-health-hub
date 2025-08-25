
-- 1) List public tables to include in backups (exclude PostGIS meta tables)
create or replace function public.list_backup_tables()
returns setof text
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.relname::text as table_name
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'  -- ordinary tables
    and c.relname not in ('geometry_columns','geography_columns','spatial_ref_sys')
  order by c.relname
$$;

-- 2) Get a comma-separated column list for a table, excluding geometry/geography
create or replace function public.get_table_columns_for_backup(p_table text)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select string_agg(quote_ident(column_name), ',')
  from information_schema.columns
  where table_schema = 'public'
    and table_name = p_table
    and udt_name not in ('geometry','geography')
$$;

-- 3) Truncate selected tables (admin-only). Restarts identities and cascades.
create or replace function public.restore_truncate_tables(p_tables text[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare idx int;
begin
  if not public.has_admin_access(auth.uid()) then
    raise exception 'forbidden';
  end if;

  if p_tables is null or array_length(p_tables,1) is null then
    return;
  end if;

  for idx in coalesce(array_lower(p_tables,1),1) .. coalesce(array_upper(p_tables,1),0) loop
    execute format('truncate table %I restart identity cascade;', p_tables[idx]);
  end loop;
end;
$$;

-- 4) Insert a JSON array of rows into the target table (admin-only).
-- Uses json_populate_recordset to map JSON keys to columns.
create or replace function public.restore_insert_rows(p_table text, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  inserted_count integer := 0;
  sql text;
begin
  if not public.has_admin_access(auth.uid()) then
    raise exception 'forbidden';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    return 0;
  end if;

  -- Build dynamic SQL: INSERT INTO public.<table> SELECT * FROM json_populate_recordset(NULL::public.<table>, $1)
  sql := format(
    'insert into %I select * from json_populate_recordset(null::%I, $1::json);',
    p_table, p_table
  );

  execute sql using p_rows::json;
  get diagnostics inserted_count = row_count;

  return inserted_count;
end;
$$;
