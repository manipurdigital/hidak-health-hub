-- Update universal_search to use enhanced medicine search logic
create or replace function public.universal_search(
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
  group_key text
) language plpgsql
security definer
stable
set search_path = public
as $$
declare
  search_query text := normalize_token(q);
begin
  return query
  with medicine_matches as (
    select 
      'medicine'::text as type,
      m.id,
      m.name as title,
      coalesce(m.generic_name, m.composition_text, m.brand) as subtitle,
      m.image_url as thumbnail_url,
      m.price,
      '/medicine/' || m.id::text as href,
      coalesce(m.composition_family_key, m.id::text) as group_key,
      -- Enhanced ranking score: brand > synonyms > generic > composition
      greatest(
        similarity(m.name, q) * 1.0,
        coalesce((select max(similarity(s, q)) from unnest(coalesce(m.brand_synonyms, array[]::text[])) s), 0) * 0.9,
        similarity(coalesce(m.generic_name,''), q) * 0.8,
        similarity(coalesce(m.composition_text,''), q) * 0.7,
        case when coalesce(m.composition_family_key,'') ilike '%'||normalize_token(q)||'%' then 0.6 else 0 end
      ) as rank_score
    from medicines m
    where m.is_active = true
      and q is not null 
      and trim(q) <> ''
      and (
        m.name ilike '%'||q||'%'
        or exists(select 1 from unnest(coalesce(m.brand_synonyms, array[]::text[])) s where s ilike '%'||q||'%')
        or coalesce(m.brand,'') ilike '%'||q||'%'
        or coalesce(m.generic_name,'') ilike '%'||q||'%'
        or coalesce(m.composition_text,'') ilike '%'||q||'%'
        or coalesce(m.composition_family_key,'') ilike '%'||normalize_token(q)||'%'
        or similarity(m.name, q) > 0.3
        or similarity(coalesce(m.brand,''), q) > 0.3
        or similarity(coalesce(m.generic_name,''), q) > 0.3
      )
    order by rank_score desc nulls last, m.name asc
    limit max_per_group
  ),
  doctor_matches as (
    select 
      'doctor'::text as type,
      d.id,
      d.full_name as title,
      d.specialization as subtitle,
      d.profile_image_url as thumbnail_url,
      d.consultation_fee as price,
      '/doctor/' || d.id::text as href,
      d.specialization as group_key
    from doctors d
    where d.is_available = true 
      and d.is_verified = true
      and q is not null
      and trim(q) <> ''
      and (
        d.full_name ilike '%' || q || '%'
        or d.specialization ilike '%' || q || '%'
        or similarity(d.full_name, q) > 0.3
      )
    order by d.rating desc nulls last, d.full_name
    limit max_per_group
  ),
  lab_test_matches as (
    select 
      'lab_test'::text as type,
      lt.id,
      lt.name as title,
      coalesce(lt.category, lt.description) as subtitle,
      lt.image_url as thumbnail_url,
      lt.price,
      '/lab-test/' || lt.id::text as href,
      coalesce(lt.category, 'lab_test') as group_key
    from lab_tests lt
    where lt.is_active = true
      and q is not null
      and trim(q) <> ''
      and (
        lt.name ilike '%' || q || '%'
        or coalesce(lt.category,'') ilike '%' || q || '%'
        or coalesce(lt.description,'') ilike '%' || q || '%'
        or similarity(lt.name, q) > 0.3
      )
    order by lt.name
    limit max_per_group
  )
  select * from medicine_matches
  union all
  select * from doctor_matches
  union all
  select * from lab_test_matches;
end;
$$;

-- Also create a v2 version that explicitly uses the dedicated search function
create or replace function public.universal_search_v2(
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
  group_key text
) language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  with medicine_matches as (
    select 
      'medicine'::text as type,
      m.id,
      m.name as title,
      coalesce(m.generic_name, m.composition_text) as subtitle,
      m.thumbnail_url,
      m.price,
      '/medicine/' || m.id::text as href,
      coalesce(m.composition_family_key, m.id::text) as group_key
    from public.search_medicines_brand_or_composition(q, max_per_group) m
  ),
  doctor_matches as (
    select 
      'doctor'::text as type,
      d.id,
      d.full_name as title,
      d.specialization as subtitle,
      d.profile_image_url as thumbnail_url,
      d.consultation_fee as price,
      '/doctor/' || d.id::text as href,
      d.specialization as group_key
    from doctors d
    where d.is_available = true 
      and d.is_verified = true
      and q is not null
      and trim(q) <> ''
      and (
        d.full_name ilike '%' || q || '%'
        or d.specialization ilike '%' || q || '%'
        or similarity(d.full_name, q) > 0.3
      )
    order by d.rating desc nulls last, d.full_name
    limit max_per_group
  ),
  lab_test_matches as (
    select 
      'lab_test'::text as type,
      lt.id,
      lt.name as title,
      coalesce(lt.category, lt.description) as subtitle,
      lt.image_url as thumbnail_url,
      lt.price,
      '/lab-test/' || lt.id::text as href,
      coalesce(lt.category, 'lab_test') as group_key
    from lab_tests lt
    where lt.is_active = true
      and q is not null
      and trim(q) <> ''
      and (
        lt.name ilike '%' || q || '%'
        or coalesce(lt.category,'') ilike '%' || q || '%'
        or coalesce(lt.description,'') ilike '%' || q || '%'
        or similarity(lt.name, q) > 0.3
      )
    order by lt.name
    limit max_per_group
  )
  select * from medicine_matches
  union all
  select * from doctor_matches
  union all
  select * from lab_test_matches;
end;
$$;