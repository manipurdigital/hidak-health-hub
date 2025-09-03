
-- 1) Add a persistent dedupe_key column to medicines
ALTER TABLE public.medicines
ADD COLUMN IF NOT EXISTS dedupe_key text;

-- 2) Backfill dedupe_key for existing rows using a normalized expression.
-- We build it from composition_key (or composition_family_key) plus brand/name/dosage_strength/pack_size.
-- Normalize by: lowercasing, trimming, collapsing whitespace.
UPDATE public.medicines
SET dedupe_key = lower(
  regexp_replace(
    trim(
      coalesce(NULLIF(composition_key, ''), composition_family_key, '') || '|' ||
      coalesce(brand, '') || '|' ||
      coalesce(name, '') || '|' ||
      coalesce(dosage_strength, '') || '|' ||
      coalesce(pack_size, '')
    ),
    '\s+',
    ' ',
    'g'
  )
)
WHERE dedupe_key IS NULL;

-- 3) Indexes to speed up dedupe checks
-- Non-unique index on dedupe_key for quick lookups during import
CREATE INDEX IF NOT EXISTS idx_medicines_dedupe_key ON public.medicines (dedupe_key);

-- Helpful index for name/brand lookups used by some import paths
CREATE INDEX IF NOT EXISTS idx_medicines_name_brand ON public.medicines (lower(name), lower(brand));

-- NOTE:
-- We are intentionally NOT adding a UNIQUE constraint yet to avoid failing due to existing duplicates.
-- After we roll out application-level dedupe and (optionally) clean up existing data,
-- we can consider:
--   CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_medicines_dedupe_key ON public.medicines (dedupe_key) WHERE dedupe_key IS NOT NULL;
