-- Add pickup window fields to lab_bookings table
ALTER TABLE public.lab_bookings 
ADD COLUMN pickup_window_start time without time zone,
ADD COLUMN pickup_window_end time without time zone;

-- Update existing records to have pickup windows based on their time_slot
UPDATE public.lab_bookings 
SET 
  pickup_window_start = CASE 
    WHEN time_slot LIKE '%8:00%' OR time_slot LIKE '%08:00%' THEN '08:00:00'::time
    WHEN time_slot LIKE '%9:00%' OR time_slot LIKE '%09:00%' THEN '09:00:00'::time
    WHEN time_slot LIKE '%10:00%' THEN '10:00:00'::time
    WHEN time_slot LIKE '%11:00%' THEN '11:00:00'::time
    WHEN time_slot LIKE '%12:00%' THEN '12:00:00'::time
    WHEN time_slot LIKE '%1:00%' OR time_slot LIKE '%13:00%' THEN '13:00:00'::time
    WHEN time_slot LIKE '%2:00%' OR time_slot LIKE '%14:00%' THEN '14:00:00'::time
    WHEN time_slot LIKE '%3:00%' OR time_slot LIKE '%15:00%' THEN '15:00:00'::time
    WHEN time_slot LIKE '%4:00%' OR time_slot LIKE '%16:00%' THEN '16:00:00'::time
    WHEN time_slot LIKE '%5:00%' OR time_slot LIKE '%17:00%' THEN '17:00:00'::time
    WHEN time_slot LIKE '%6:00%' OR time_slot LIKE '%18:00%' THEN '18:00:00'::time
    ELSE '09:00:00'::time
  END,
  pickup_window_end = CASE 
    WHEN time_slot LIKE '%8:00%' OR time_slot LIKE '%08:00%' THEN '10:00:00'::time
    WHEN time_slot LIKE '%9:00%' OR time_slot LIKE '%09:00%' THEN '11:00:00'::time
    WHEN time_slot LIKE '%10:00%' THEN '12:00:00'::time
    WHEN time_slot LIKE '%11:00%' THEN '13:00:00'::time
    WHEN time_slot LIKE '%12:00%' THEN '14:00:00'::time
    WHEN time_slot LIKE '%1:00%' OR time_slot LIKE '%13:00%' THEN '15:00:00'::time
    WHEN time_slot LIKE '%2:00%' OR time_slot LIKE '%14:00%' THEN '16:00:00'::time
    WHEN time_slot LIKE '%3:00%' OR time_slot LIKE '%15:00%' THEN '17:00:00'::time
    WHEN time_slot LIKE '%4:00%' OR time_slot LIKE '%16:00%' THEN '18:00:00'::time
    WHEN time_slot LIKE '%5:00%' OR time_slot LIKE '%17:00%' THEN '19:00:00'::time
    WHEN time_slot LIKE '%6:00%' OR time_slot LIKE '%18:00%' THEN '20:00:00'::time
    ELSE '11:00:00'::time
  END;