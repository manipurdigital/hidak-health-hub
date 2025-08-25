
-- Create a secure function to export a plain SQL schema dump for the "public" schema
-- Only admins can execute it (via p_requester check). We avoid relying on auth.uid(),
-- so our Edge Function can pass the caller's user_id while using the service role client.

create or replace function public.export_schema_sql(p_requester uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ddl text := '';
  rec record;
begin
  -- Authorization check
  if not public.has_admin_access(p_requester) then
    raise exception 'forbidden';
  end if;

  -- Header and extensions (safe if present)
  ddl := ddl
    || '-- Plain SQL schema export for schema: public' || E'\n'
    || '-- Generated at: ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS TZ') || E'\n\n'
    || 'SET client_encoding = ''UTF8'';' || E'\n'
    || 'SET standard_conforming_strings = on;' || E'\n'
    || 'SET check_function_bodies = false;' || E'\n'
    || 'SET client_min_messages = warning;' || E'\n\n'
    || 'CREATE EXTENSION IF NOT EXISTS "pg_trgm";' || E'\n'
    || 'CREATE EXTENSION IF NOT EXISTS "postgis";' || E'\n\n';

  -- Tables (exclude extension-managed meta tables)
  for rec in
    select c.oid as oid, n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not in ('geometry_columns', 'geography_columns', 'spatial_ref_sys')
    order by c.relname
  loop
    ddl := ddl || format('CREATE TABLE %I.%I (', rec.nspname, rec.relname) || E'\n';
    ddl := ddl || coalesce((
      select string_agg(
        '  ' || quote_ident(a.attname) || ' ' || pg_catalog.format_type(a.atttypid, a.atttypmod)
        || case when a.attnotnull then ' NOT NULL' else '' end
        || case when ad.adbin is not null then ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid) else '' end
      , E',\n' order by a.attnum)
      from pg_attribute a
      left join pg_attrdef ad on a.attrelid = ad.adrelid and a.attnum = ad.adnum
      where a.attrelid = rec.oid and a.attnum > 0 and not a.attisdropped
    ), '') || E'\n);\n\n';
  end loop;

  -- Sequences (minimal definitions)
  for rec in
    select c.oid, n.nspname, c.relname as seqname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'S'
    order by c.relname
  loop
    ddl := ddl || format('CREATE SEQUENCE IF NOT EXISTS %I.%I;', rec.nspname, rec.seqname) || E'\n';
  end loop;
  ddl := ddl || E'\n';

  -- Constraints (PK, FK, CHECK) via pg_get_constraintdef
  for rec in
    select con.oid, n.nspname, c.relname, con.conname
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and con.conrelid <> 0
    order by c.relname, con.conname
  loop
    ddl := ddl || format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I %s;',
      rec.nspname, rec.relname, rec.conname, pg_get_constraintdef(rec.oid, true)
    ) || E'\n';
  end loop;
  ddl := ddl || E'\n';

  -- Indexes (exclude primary keys)
  for rec in
    select i.indexrelid, n.nspname, c.relname as tablename, ic.relname as idxname
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_class ic on ic.oid = i.indexrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not i.indisprimary
    order by c.relname, ic.relname
  loop
    ddl := ddl || pg_get_indexdef(rec.indexrelid) || ';' || E'\n';
  end loop;
  ddl := ddl || E'\n';

  -- Views
  for rec in
    select c.oid, n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
    order by c.relname
  loop
    ddl := ddl || format(
      'CREATE OR REPLACE VIEW %I.%I AS %s;',
      rec.nspname, rec.relname, pg_get_viewdef(rec.oid, true)
    ) || E'\n';
  end loop;
  ddl := ddl || E'\n';

  -- Materialized Views
  for rec in
    select c.oid, n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'm'
    order by c.relname
  loop
    ddl := ddl || format(
      'CREATE MATERIALIZED VIEW %I.%I AS %s;',
      rec.nspname, rec.relname, pg_get_viewdef(rec.oid, true)
    ) || E'\n';
  end loop;
  ddl := ddl || E'\n';

  -- Functions (exclude this export function itself)
  for rec in
    select p.oid, n.nspname, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname <> 'export_schema_sql'
    order by p.proname
  loop
    ddl := ddl || pg_get_functiondef(rec.oid) || E';\n\n';
  end loop;

  -- Triggers (non-internal only)
  for rec in
    select t.oid, n.nspname, c.relname, t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not t.tgisinternal
    order by c.relname, t.tgname
  loop
    ddl := ddl || pg_get_triggerdef(rec.oid, true) || E';\n';
  end loop;
  ddl := ddl || E'\n';

  -- RLS enablement
  for rec in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('geometry_columns', 'geography_columns', 'spatial_ref_sys')
  loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.relname = rec.tablename
        and n.nspname = rec.schemaname
        and c.relrowsecurity
    ) then
      ddl := ddl || format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', rec.schemaname, rec.tablename) || E'\n';
    end if;
  end loop;
  ddl := ddl || E'\n';

  -- Policies
  for rec in
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname
  loop
    ddl := ddl || format(
      'CREATE POLICY %I ON %I.%I FOR %s TO %s%s%s;',
      rec.policyname,
      rec.schemaname,
      rec.tablename,
      lower(rec.cmd),
      case
        when array_length(rec.roles, 1) is null then 'PUBLIC'
        else array_to_string( array(select quote_ident(r) from unnest(rec.roles) r), ', ' )
      end,
      case when rec.qual is not null then ' USING (' || rec.qual || ')' else '' end,
      case when rec.with_check is not null then ' WITH CHECK (' || rec.with_check || ')' else '' end
    ) || E'\n';
  end loop;

  return ddl;
end;
$$;
