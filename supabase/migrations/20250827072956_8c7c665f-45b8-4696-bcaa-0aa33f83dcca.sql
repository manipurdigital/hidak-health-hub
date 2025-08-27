
-- 1) Schema changes: follow-up window fields
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_expires_at timestamptz;

-- 2) Trigger to auto-manage follow-up timestamps
CREATE OR REPLACE FUNCTION public.consultations_followup_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- On insert
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := COALESCE(NEW.paid_at, now());
    END IF;
    IF NEW.status = 'completed' THEN
      NEW.follow_up_expires_at := NEW.completed_at + interval '72 hours';
    END IF;
    RETURN NEW;
  END IF;

  -- On update
  IF TG_OP = 'UPDATE' THEN
    -- If status becomes completed, set completed_at if null and compute expiry
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM NEW.status OR NEW.completed_at IS NULL) THEN
      IF NEW.completed_at IS NULL THEN
        NEW.completed_at := now();
      END IF;
      NEW.follow_up_expires_at := NEW.completed_at + interval '72 hours';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_consultations_followup_fields ON public.consultations;
CREATE TRIGGER trg_consultations_followup_fields
BEFORE INSERT OR UPDATE ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.consultations_followup_fields();

-- 3) Backfill existing completed consultations lacking these fields
UPDATE public.consultations c
SET completed_at = COALESCE(c.completed_at, c.paid_at, c.updated_at, c.created_at),
    follow_up_expires_at = COALESCE(c.completed_at, c.paid_at, c.updated_at, c.created_at) + interval '72 hours'
WHERE c.status = 'completed' AND c.completed_at IS NULL;

-- 4) Helper function to count patient messages after completion
--    Use SECURITY DEFINER to avoid RLS recursion when called inside policies
CREATE OR REPLACE FUNCTION public.count_patient_messages_after_completion(
  p_consultation_id uuid,
  p_completed_at timestamptz
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.consultation_messages m
  WHERE m.consultation_id = p_consultation_id
    AND m.sender_type = 'patient'
    AND m.sent_at >= p_completed_at;
$$;

-- 5) Performance index for counting
CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation_sender_time
  ON public.consultation_messages (consultation_id, sender_type, sent_at);

-- 6) RLS: tighten send policy to 72h + 10 patient messages limit
DROP POLICY IF EXISTS "Patients and doctors can send messages" ON public.consultation_messages;

CREATE POLICY "Send messages during consult or follow-up window"
ON public.consultation_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.consultations c
    LEFT JOIN public.doctors d ON d.id = c.doctor_id
    WHERE c.id = consultation_id
      AND (
        -- Normal chat during scheduled/in_progress
        (
          c.status IN ('scheduled','in_progress') AND
          (
            (consultation_messages.sender_type = 'patient' AND c.patient_id = auth.uid()) OR
            (consultation_messages.sender_type = 'doctor' AND d.user_id = auth.uid())
          )
        )
        OR
        -- Post-consultation follow-up window: strictly within 72 hours of completion
        (
          c.status = 'completed'
          AND c.completed_at IS NOT NULL
          AND c.follow_up_expires_at IS NOT NULL
          AND now() <= c.follow_up_expires_at
          AND (
            -- Limit patient to < 10 messages after completion
            CASE
              WHEN consultation_messages.sender_type = 'patient'
              THEN public.count_patient_messages_after_completion(c.id, c.completed_at) < 10
              ELSE true
            END
          )
          AND (
            (consultation_messages.sender_type = 'patient' AND c.patient_id = auth.uid()) OR
            (consultation_messages.sender_type = 'doctor' AND d.user_id = auth.uid())
          )
        )
      )
  )
);
