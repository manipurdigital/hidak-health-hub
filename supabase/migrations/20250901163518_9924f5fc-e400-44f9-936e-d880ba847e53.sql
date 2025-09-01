
-- 1) Add address + GPS columns for lab bookings
ALTER TABLE public.lab_bookings
  ADD COLUMN IF NOT EXISTS pickup_lat double precision,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision,
  ADD COLUMN IF NOT EXISTS pickup_address jsonb;

-- Optional: helpful comment for maintainers
COMMENT ON COLUMN public.lab_bookings.pickup_lat IS 'Latitude for home collection location';
COMMENT ON COLUMN public.lab_bookings.pickup_lng IS 'Longitude for home collection location';
COMMENT ON COLUMN public.lab_bookings.pickup_address IS 'Full address JSON captured at booking time';
