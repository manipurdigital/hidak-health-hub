
-- Make lab bookings date-only by allowing time to be set later by the center
ALTER TABLE public.lab_bookings
  ALTER COLUMN booking_time DROP NOT NULL;

-- Optional: annotate the purpose for maintainers (does not change behavior)
COMMENT ON COLUMN public.lab_bookings.booking_time IS
  'Optional. Confirmed collection time set by lab center later. Customers select only the date.';
