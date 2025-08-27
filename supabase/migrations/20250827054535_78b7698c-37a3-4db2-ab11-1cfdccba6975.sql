-- Clear all booking data to start fresh
DELETE FROM public.consultation_messages;
DELETE FROM public.consultations;
DELETE FROM public.lab_bookings;

-- Reset any related sequences if needed
-- Note: UUIDs are used, so no sequence reset needed