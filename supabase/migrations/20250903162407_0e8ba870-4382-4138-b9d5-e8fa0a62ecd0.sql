-- Remove duplicate user_roles entries
DELETE FROM public.user_roles a USING public.user_roles b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.role = b.role;

-- Add unique constraint on (user_id, role)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_unique 
UNIQUE (user_id, role);