-- Ensure realtime is fully enabled for call-related tables
-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE consultations;

-- Ensure REPLICA IDENTITY FULL is set for all call tables
ALTER TABLE call_sessions REPLICA IDENTITY FULL;
ALTER TABLE call_participants REPLICA IDENTITY FULL;
ALTER TABLE consultations REPLICA IDENTITY FULL;