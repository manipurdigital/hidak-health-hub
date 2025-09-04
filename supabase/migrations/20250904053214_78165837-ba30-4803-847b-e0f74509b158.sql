-- Update RLS policies on consultation_messages to allow doctors (via doctors.user_id) to read and insert messages for their consultations

-- Drop existing policies if they exist to avoid duplicates
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'consultation_messages' AND policyname = 'Users can create consultation messages'
  ) THEN
    DROP POLICY "Users can create consultation messages" ON public.consultation_messages;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'consultation_messages' AND policyname = 'Users can view consultation messages'
  ) THEN
    DROP POLICY "Users can view consultation messages" ON public.consultation_messages;
  END IF;
END $$;

-- Create permissive INSERT policy with doctor mapping
CREATE POLICY "Users can create consultation messages"
ON public.consultation_messages
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  -- Sender must be the logged-in user
  auth.uid() = sender_id
  AND (
    -- Either the user is the patient on the consultation
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND c.patient_id = auth.uid()
    )
    OR
    -- Or the user is the doctor mapped via doctors.user_id
    EXISTS (
      SELECT 1 FROM public.consultations c
      JOIN public.doctors d ON d.id = c.doctor_id
      WHERE c.id = consultation_id
        AND d.user_id = auth.uid()
    )
  )
);

-- Create permissive SELECT policy with doctor mapping
CREATE POLICY "Users can view consultation messages"
ON public.consultation_messages
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id
        AND (c.patient_id = auth.uid() OR c.doctor_id = auth.uid())
    )
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM public.consultations c
      JOIN public.doctors d ON d.id = c.doctor_id
      WHERE c.id = consultation_id
        AND d.user_id = auth.uid()
    )
  )
);
