-- Make user_id nullable and add contact_email for admin-managed doctors
ALTER TABLE public.doctors ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.doctors ADD COLUMN contact_email text;

-- Create partial unique index to prevent duplicate user_id when not null
CREATE UNIQUE INDEX doctors_user_id_unique_when_not_null 
ON public.doctors (user_id) 
WHERE user_id IS NOT NULL;

-- Add index on contact_email for lookups
CREATE INDEX doctors_contact_email_idx ON public.doctors (contact_email);

-- Update RLS policies to handle nullable user_id
DROP POLICY IF EXISTS "Doctors can manage their own profile" ON public.doctors;

CREATE POLICY "Doctors can manage their own profile" 
ON public.doctors 
FOR ALL 
USING (user_id IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);