
-- WARNING: This is a destructive operation.
-- It will permanently remove all rows from public.medicines
-- AND any dependent rows in tables with foreign keys to medicines
-- (e.g., carts, import_job_items, potentially order_items, etc.)

BEGIN;

TRUNCATE TABLE public.medicines CASCADE;

-- Optional verification
SELECT COUNT(*) AS remaining_medicines FROM public.medicines;

COMMIT;
