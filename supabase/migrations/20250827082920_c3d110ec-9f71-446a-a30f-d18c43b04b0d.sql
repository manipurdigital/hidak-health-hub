
DO $$
BEGIN
  -- Ensure RLS is enabled on prescriptions
  PERFORM 1
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'prescriptions' AND c.relrowsecurity = true;

  IF NOT FOUND THEN
    EXECUTE 'ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY';
  END IF;

  -- SELECT policies

  -- Patients can view their own prescriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions'
      AND policyname = 'Patients can view their prescriptions'
  ) THEN
    CREATE POLICY "Patients can view their prescriptions"
      ON public.prescriptions
      FOR SELECT
      USING (patient_id = auth.uid());
  END IF;

  -- Doctors can view prescriptions they authored
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions'
      AND policyname = 'Doctors can view their authored prescriptions'
  ) THEN
    CREATE POLICY "Doctors can view their authored prescriptions"
      ON public.prescriptions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.doctors d
          WHERE d.id = prescriptions.doctor_id
            AND d.user_id = auth.uid()
        )
      );
  END IF;

  -- INSERT policy: Doctors can create prescriptions for their consultations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions'
      AND policyname = 'Doctors can create prescriptions for their consultations'
  ) THEN
    CREATE POLICY "Doctors can create prescriptions for their consultations"
      ON public.prescriptions
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.consultations c
          JOIN public.doctors d ON d.id = c.doctor_id
          WHERE c.id = prescriptions.consultation_id
            AND d.user_id = auth.uid()
        )
      );
  END IF;

  -- UPDATE policy: Doctors can update their authored prescriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions'
      AND policyname = 'Doctors can update their authored prescriptions'
  ) THEN
    CREATE POLICY "Doctors can update their authored prescriptions"
      ON public.prescriptions
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.doctors d
          WHERE d.id = prescriptions.doctor_id
            AND d.user_id = auth.uid()
        )
      );
  END IF;

  -- DELETE policy: (optional) Doctors can delete their authored prescriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prescriptions'
      AND policyname = 'Doctors can delete their authored prescriptions'
  ) THEN
    CREATE POLICY "Doctors can delete their authored prescriptions"
      ON public.prescriptions
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.doctors d
          WHERE d.id = prescriptions.doctor_id
            AND d.user_id = auth.uid()
        )
      );
  END IF;

  -- Helpful indexes for performance
  CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_created_at
    ON public.prescriptions (doctor_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_created_at
    ON public.prescriptions (patient_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation
    ON public.prescriptions (consultation_id);

  -- Keep updated_at fresh on update
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_prescriptions_updated_at'
  ) THEN
    CREATE TRIGGER trg_prescriptions_updated_at
      BEFORE UPDATE ON public.prescriptions
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;
