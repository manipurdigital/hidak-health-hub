-- Function to get consultations by doctor
CREATE OR REPLACE FUNCTION public.consultations_by_doctor(start_date date, end_date date)
 RETURNS TABLE(doctor_name text, specialization text, consultations bigint, completed bigint, revenue numeric, avg_fee numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    d.full_name as doctor_name,
    d.specialization,
    COUNT(c.id)::BIGINT as consultations,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END)::BIGINT as completed,
    COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.total_amount ELSE 0 END), 0) as revenue,
    CASE WHEN COUNT(c.id) > 0 THEN ROUND(AVG(c.total_amount), 2) ELSE 0 END as avg_fee
  FROM consultations c
  JOIN doctors d ON c.doctor_id = d.id
  WHERE c.consultation_date >= start_date 
    AND c.consultation_date <= end_date
  GROUP BY d.id, d.full_name, d.specialization
  ORDER BY revenue DESC;
$function$