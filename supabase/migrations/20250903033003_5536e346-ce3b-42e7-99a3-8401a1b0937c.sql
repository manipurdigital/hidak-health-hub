
-- Add source-tracking and image metadata columns required by the importer
ALTER TABLE public.medicines 
  ADD COLUMN IF NOT EXISTS external_source_url text,
  ADD COLUMN IF NOT EXISTS external_source_domain text,
  ADD COLUMN IF NOT EXISTS source_attribution text,
  ADD COLUMN IF NOT EXISTS source_checksum text,
  ADD COLUMN IF NOT EXISTS source_last_fetched timestamptz,
  ADD COLUMN IF NOT EXISTS original_image_url text,
  ADD COLUMN IF NOT EXISTS image_hash text;

-- Optional: lightweight indexes to speed future enrichment/duplicates (safe to keep even if unused)
CREATE INDEX IF NOT EXISTS idx_medicines_external_source_domain ON public.medicines (external_source_domain);
CREATE INDEX IF NOT EXISTS idx_medicines_source_last_fetched ON public.medicines (source_last_fetched);
