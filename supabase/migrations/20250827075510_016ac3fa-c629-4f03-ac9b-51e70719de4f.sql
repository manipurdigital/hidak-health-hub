
DO $$
BEGIN
  -- 1) Add the missing FK so Supabase relational selects work:
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consultations_patient_id_fkey'
  ) THEN
    ALTER TABLE public.consultations
      ADD CONSTRAINT consultations_patient_id_fkey
      FOREIGN KEY (patient_id)
      REFERENCES public.profiles(user_id)
      ON DELETE CASCADE;
  END IF;

  -- 2) Helpful indexes for performance:

  -- For doctor dashboard queries (priority by status/date/time):
  CREATE INDEX IF NOT EXISTS idx_consultations_doctor_status_date_time
    ON public.consultations (doctor_id, status, consultation_date, time_slot);

  -- For patient account queries:
  CREATE INDEX IF NOT EXISTS idx_consultations_patient_date
    ON public.consultations (patient_id, consultation_date DESC);
END$$;
