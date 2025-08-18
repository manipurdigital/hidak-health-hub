-- Search medicines by brand or composition (ranked)
create or replace function public.search_medicines_brand_or_composition(
  q text,
  max_rows int default 20
)
returns table(
  id uuid,
  name text,
  generic_name text,
  composition_text text,
  composition_key text,
  composition_family_key text,
  thumbnail_url text,
  price numeric,
  rank_score numeric
)
language sql
security definer
stable
set search_path = public
as $$
  with needle as (select trim(coalesce(q,'')) q)
  select m.id, m.name, m.generic_name, m.composition_text,
         m.composition_key, m.composition_family_key,
         m.image_url as thumbnail_url, m.price,
         -- blended score: brand > generic > composition
         greatest(
           similarity(m.name, n.q) * 1.0,
           coalesce((select max(similarity(s, n.q)) from unnest(coalesce(m.brand_synonyms, array[]::text[])) s), 0) * 0.9,
           similarity(coalesce(m.generic_name,''), n.q) * 0.8,
           similarity(coalesce(m.composition_text,''), n.q) * 0.7
         ) as rank_score
  from medicines m, needle n
  where m.is_active = true
    and n.q <> ''
    and (
      m.name ilike '%'||n.q||'%'
      or exists(select 1 from unnest(coalesce(m.brand_synonyms, array[]::text[])) s where s ilike '%'||n.q||'%')
      or coalesce(m.generic_name,'') ilike '%'||n.q||'%'
      or coalesce(m.composition_text,'') ilike '%'||n.q||'%'
      or coalesce(m.composition_family_key,'') ilike '%'||normalize_token(n.q)||'%'  -- handles "paracetamol caffeine"
    )
  order by rank_score desc nulls last, m.name asc
  limit max_rows;
$$;

grant execute on function public.search_medicines_brand_or_composition(text,int) to anon, authenticated;

-- Get alternatives with same composition (exact or family)
create or replace function public.similar_medicines(
  ref_medicine_id uuid,
  mode text default 'exact'   -- 'exact' | 'family'
)
returns table(
  id uuid,
  name text,
  price numeric,
  thumbnail_url text
)
language sql
security definer
stable
set search_path = public
as $$
  with ref as (
    select composition_key, composition_family_key
    from medicines where id = ref_medicine_id
  )
  select m.id, m.name, m.price, m.image_url as thumbnail_url
  from medicines m, ref r
  where m.is_active = true
    and case when mode = 'family'
             then m.composition_family_key = r.composition_family_key
             else m.composition_key        = r.composition_key
        end
    and m.id <> ref_medicine_id
    and coalesce(r.composition_key, r.composition_family_key) is not null
  order by m.price asc nulls last, m.name asc
  limit 50;
$$;

grant execute on function public.similar_medicines(uuid,text) to anon, authenticated;

-- Update universal search to use the new medicine search function
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
) language plpgsql
security definer
stable
set search_path = public
as $$
declare
  search_query text := normalize_token(q);
begin
  -- Return medicines using enhanced search and alternatives
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
      false as is_alternative,
      case 
        when m.name ilike '%' || q || '%' then 'brand_name'
        when similarity(m.name, q) > 0.5 then 'fuzzy_brand'
        when coalesce(m.generic_name,'') ilike '%' || q || '%' then 'generic'
        when coalesce(m.composition_text,'') ilike '%' || q || '%' then 'composition_text'
        else 'other'
      end as composition_match_type
    from public.search_medicines_brand_or_composition(q, max_per_group) m
  ),
  alternatives as (
    select 
      'medicine'::text as type,
      sm.id,
      sm.name as title,
      'Alternative medicine' as subtitle,
      sm.thumbnail_url,
      sm.price,
      '/medicine/' || sm.id::text as href,
      true as is_alternative,
      'same_composition' as composition_match_type
    from medicine_matches mm
    cross join lateral public.similar_medicines(mm.id, 'family') sm
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
      false as is_alternative,
      'doctor_match' as composition_match_type
    from doctors d
    where d.is_available = true 
      and d.is_verified = true
      and (
        d.full_name ilike '%' || q || '%'
        or d.specialization ilike '%' || q || '%'
      )
    order by d.rating desc nulls last
    limit max_per_group
  ),
  lab_test_matches as (
    select 
      'lab_test'::text as type,
      lt.id,
      lt.name as title,
      lt.category as subtitle,
      lt.image_url as thumbnail_url,
      lt.price,
      '/lab-test/' || lt.id::text as href,
      false as is_alternative,
      'lab_test_match' as composition_match_type
    from lab_tests lt
    where lt.is_active = true
      and (
        lt.name ilike '%' || q || '%'
        or lt.category ilike '%' || q || '%'
        or lt.description ilike '%' || q || '%'
      )
    order by lt.name
    limit max_per_group
  )
  select * from medicine_matches
  union all
  select * from alternatives
  union all
  select * from doctor_matches
  union all
  select * from lab_test_matches;
end;
$$;