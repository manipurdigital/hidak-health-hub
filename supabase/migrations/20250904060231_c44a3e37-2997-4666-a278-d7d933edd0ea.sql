-- Drop the existing foreign key constraint that references doctors(id)
ALTER TABLE public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_doctor_id_fkey;

-- Add a new foreign key constraint that references auth.users(id) since we're storing user IDs
ALTER TABLE public.prescriptions ADD CONSTRAINT prescriptions_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the RLS policy to work with the user ID approach
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
FOR INSERT WITH CHECK (
  auth.uid() = doctor_id AND 
  EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
);

-- Update the RLS policy for updates too
DROP POLICY IF EXISTS "Doctors can update their prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can update their prescriptions" ON public.prescriptions
FOR UPDATE USING (
  auth.uid() = doctor_id AND 
  EXISTS (SELECT 1 FROM public.doctors WHERE user_id = auth.uid())
);