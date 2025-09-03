-- Allow doctors to view consultations where they are the assigned doctor (via doctors.user_id mapping)
CREATE POLICY "Doctors can view their consultations (via mapping)" 
ON public.consultations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = consultations.doctor_id
      AND d.user_id = auth.uid()
  )
);

-- Also allow doctors to update their consultations via the same mapping (without weakening existing admin policy)
CREATE POLICY "Doctors can update their consultations (via mapping)"
ON public.consultations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = consultations.doctor_id
      AND d.user_id = auth.uid()
  )
);
