
-- Enable realtime for call sessions, call participants, and consultations
-- These ensure full row data is replicated and tables are added to the realtime publication

-- 1) REPLICA IDENTITY FULL for complete payloads on updates
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.call_participants REPLICA IDENTITY FULL;
ALTER TABLE public.consultations REPLICA IDENTITY FULL;

-- 2) Add tables to supabase_realtime publication (guard against duplicates)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_participants;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;
