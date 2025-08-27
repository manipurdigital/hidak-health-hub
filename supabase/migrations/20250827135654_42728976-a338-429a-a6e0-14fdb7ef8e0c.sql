-- First disable all foreign key constraints temporarily
SET session_replication_role = replica;

-- Force delete all medicines
DELETE FROM public.medicines;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Verify deletion
SELECT COUNT(*) as remaining_count FROM public.medicines;