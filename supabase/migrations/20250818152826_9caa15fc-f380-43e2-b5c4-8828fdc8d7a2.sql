-- Add new roles for center staff in separate transactions
ALTER TYPE public.app_role ADD VALUE 'center';
ALTER TYPE public.app_role ADD VALUE 'center_staff';