-- Create function to get booked consultation slots for a doctor
CREATE OR REPLACE FUNCTION get_booked_slots(doctor_id_param uuid, start_date date, end_date date)
RETURNS TABLE(
  consultation_date date,
  time_slot text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.consultation_date,
    c.time_slot
  FROM consultations c
  WHERE c.doctor_id = doctor_id_param
    AND c.consultation_date >= start_date
    AND c.consultation_date <= end_date
    AND c.status NOT IN ('cancelled', 'no_show')
  ORDER BY c.consultation_date, c.time_slot;
$$;