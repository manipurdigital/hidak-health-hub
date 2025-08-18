-- Add trigram extension for fuzzy matching
create extension if not exists pg_trgm;

-- Add helper columns for brand and composition normalization
alter table medicines
  add column if not exists brand_synonyms text[] default array[]::text[],
  add column if not exists composition_text text,           -- raw label like "Paracetamol 650 mg + Caffeine 50 mg"
  add column if not exists composition_key text,            -- exact actives+strengths canonical key
  add column if not exists composition_family_key text,     -- actives only (no strength) canonical key
  add column if not exists generic_name text;               -- generic/composition name

-- Canonicalizers
create or replace function public.normalize_token(s text)
returns text language sql immutable as $$
  select trim(regexp_replace(lower(coalesce(s,'')), '\s+', ' ', 'g'));
$$;

-- Build "exact" key with strength preserved and salts sorted (e.g., "caffeine:50mg+paracetamol:650mg")
create or replace function public.composition_key_from_text(txt text)
returns text language plpgsql immutable as $$
declare parts text[]; out_parts text[] := array[]::text[]; p text; n text; dose text;
begin
  if txt is null then return null; end if;
  -- split on + , / & ; also handle " - " joins
  parts := regexp_split_to_array(txt, '\s*(\+|/|&|,|;|-)\s*');
  foreach p in array parts loop
    n    := normalize_token(regexp_replace(p, '(\d+(\.\d+)?)\s*(mg|mcg|g|ml|%)', '', 'gi'));
    dose := normalize_token(regexp_replace(p, '.*?(\d+(\.\d+)?)\s*(mg|mcg|g|ml|%).*', '\1\3', 'gi'));
    if n <> '' then
      out_parts := out_parts || (n || case when dose <> '' then ':'||dose else '' end);
    end if;
  end loop;
  -- sort to make order-independent
  select string_agg(x, '+' order by x) from unnest(out_parts) x into txt;
  return txt;
end;
$$;

-- Build "family" key ignoring strength (e.g., "caffeine+paracetamol")
create or replace function public.composition_family_key_from_text(txt text)
returns text language plpgsql immutable as $$
declare parts text[]; names text[] := array[]::text[]; p text; n text;
begin
  if txt is null then return null; end if;
  parts := regexp_split_to_array(txt, '\s*(\+|/|&|,|;|-)\s*');
  foreach p in array parts loop
    n := normalize_token(regexp_replace(p, '(\d+(\.\d+)?)\s*(mg|mcg|g|ml|%)', '', 'gi'));
    if n <> '' then names := names || n; end if;
  end loop;
  select string_agg(x, '+' order by x) from unnest(names) x into txt;
  return txt;
end;
$$;

-- Enhanced universal search function with brand and composition support
create or replace function public.universal_search_with_alternatives(
  q text,
  max_per_group integer default 5
) returns table(
  type text,
  id uuid,
  title text,
  subtitle text,
  thumbnail_url text,
  price numeric,
  href text,
  is_alternative boolean,
  composition_match_type text
) language plpgsql as $$
declare
  search_query text := normalize_token(q);
  comp_key text;
  comp_family_key text;
begin
  -- Try to extract composition keys from the search query
  comp_key := composition_key_from_text(q);
  comp_family_key := composition_family_key_from_text(q);

  -- Return medicines with brand/composition matches and alternatives
  return query
  with medicine_matches as (
    select 
      'medicine'::text as type,
      m.id,
      m.name as title,
      coalesce(m.brand, m.generic_name) as subtitle,
      m.image_url as thumbnail_url,
      m.price,
      '/medicine/' || m.id::text as href,
      false as is_alternative,
      case 
        when m.name ilike '%' || q || '%' then 'brand_name'
        when m.brand ilike '%' || q || '%' then 'brand'
        when m.generic_name ilike '%' || q || '%' then 'generic'
        when m.composition_text ilike '%' || q || '%' then 'composition_text'
        when similarity(m.name, q) > 0.3 then 'fuzzy_name'
        when similarity(coalesce(m.brand, ''), q) > 0.3 then 'fuzzy_brand'
        else 'other'
      end as composition_match_type,
      case 
        when m.name ilike '%' || q || '%' then 1
        when m.brand ilike '%' || q || '%' then 2
        when m.generic_name ilike '%' || q || '%' then 3
        when m.composition_text ilike '%' || q || '%' then 4
        when similarity(m.name, q) > 0.3 then 5
        when similarity(coalesce(m.brand, ''), q) > 0.3 then 6
        else 7
      end as relevance
    from medicines m
    where m.is_active = true
      and (
        m.name ilike '%' || q || '%'
        or m.brand ilike '%' || q || '%'
        or m.generic_name ilike '%' || q || '%'
        or m.composition_text ilike '%' || q || '%'
        or similarity(m.name, q) > 0.3
        or similarity(coalesce(m.brand, ''), q) > 0.3
        or similarity(coalesce(m.generic_name, ''), q) > 0.3
        or exists (
          select 1 from unnest(m.brand_synonyms) as syn
          where syn ilike '%' || q || '%'
        )
      )
    order by relevance, m.price
    limit max_per_group
  ),
  alternatives as (
    select 
      'medicine'::text as type,
      m.id,
      m.name as title,
      coalesce(m.brand, m.generic_name) as subtitle,
      m.image_url as thumbnail_url,
      m.price,
      '/medicine/' || m.id::text as href,
      true as is_alternative,
      case 
        when m.composition_key = comp_key then 'exact_composition'
        when m.composition_family_key = comp_family_key then 'same_actives'
        else 'similar'
      end as composition_match_type
    from medicines m
    where m.is_active = true
      and (
        (comp_key is not null and m.composition_key = comp_key)
        or (comp_family_key is not null and m.composition_family_key = comp_family_key)
      )
      and m.id not in (select mm.id from medicine_matches mm)
    order by 
      case when m.composition_key = comp_key then 1 else 2 end,
      m.price
    limit max_per_group
  )
  select * from medicine_matches
  union all
  select * from alternatives;
end;
$$;

-- Backfill composition keys
update medicines
set 
  composition_key = composition_key_from_text(coalesce(composition_text, generic_name, name)),
  composition_family_key = composition_family_key_from_text(coalesce(composition_text, generic_name, name)),
  generic_name = coalesce(generic_name, name)
where composition_key is null or composition_family_key is null;

-- Indexes to speed up brand & composition queries
create index if not exists idx_meds_name_trgm on medicines using gin (name gin_trgm_ops);
create index if not exists idx_meds_brand_trgm on medicines using gin (brand gin_trgm_ops);
create index if not exists idx_meds_brand_syn_gin on medicines using gin (brand_synonyms);
create index if not exists idx_meds_generic_trgm on medicines using gin (generic_name gin_trgm_ops);
create index if not exists idx_meds_composition_trgm on medicines using gin (composition_text gin_trgm_ops);
create index if not exists idx_meds_comp_key on medicines (composition_key);
create index if not exists idx_meds_comp_family_key on medicines (composition_family_key);