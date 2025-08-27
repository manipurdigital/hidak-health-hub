
-- Danger: permanently deletes ALL medicines
BEGIN;

DELETE FROM public.medicines;

COMMIT;
