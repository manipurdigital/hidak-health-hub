-- Create admin function to link center accounts (similar to doctor linking)
CREATE OR REPLACE FUNCTION admin_link_center_account(
  p_user_id UUID,
  p_center_id UUID,
  p_role TEXT DEFAULT 'center'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check admin permissions
  IF NOT has_admin_access() THEN
    RAISE EXCEPTION 'Only admins can link center accounts';
  END IF;

  -- Validate center exists
  IF NOT EXISTS (SELECT 1 FROM diagnostic_centers WHERE id = p_center_id) THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  -- Remove existing center role for this user
  DELETE FROM user_roles 
  WHERE user_id = p_user_id 
  AND role IN ('center', 'center_staff');

  -- Remove existing center staff entries for this user
  DELETE FROM center_staff WHERE user_id = p_user_id;

  -- Add new role
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Add center staff entry
  INSERT INTO center_staff (user_id, center_id, role, is_active)
  VALUES (p_user_id, p_center_id, CASE WHEN p_role = 'center' THEN 'admin' ELSE 'staff' END, true)
  ON CONFLICT (user_id, center_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();
END;
$$;

-- Update RLS policies for lab_bookings to be center-specific
DROP POLICY IF EXISTS "Center staff can view assigned bookings" ON lab_bookings;
DROP POLICY IF EXISTS "Center staff can update assigned bookings" ON lab_bookings;

CREATE POLICY "Center staff can view their center bookings" 
ON lab_bookings 
FOR SELECT 
USING (
  center_id IN (
    SELECT cs.center_id 
    FROM center_staff cs 
    WHERE cs.user_id = auth.uid() 
    AND cs.is_active = true
  )
);

CREATE POLICY "Center staff can update their center bookings" 
ON lab_bookings 
FOR UPDATE 
USING (
  center_id IN (
    SELECT cs.center_id 
    FROM center_staff cs 
    WHERE cs.user_id = auth.uid() 
    AND cs.is_active = true
  )
);

-- Create function to get center bookings with metrics
CREATE OR REPLACE FUNCTION get_center_bookings(p_center_id UUID)
RETURNS TABLE(
  id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  test_name TEXT,
  booking_date DATE,
  time_slot TEXT,
  status TEXT,
  total_amount NUMERIC,
  pickup_address JSONB,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  special_instructions TEXT,
  collector_name TEXT,
  eta TIMESTAMP WITH TIME ZONE,
  collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    lb.id,
    lb.patient_name,
    lb.patient_phone,
    lt.name as test_name,
    lb.booking_date,
    lb.time_slot,
    lb.status,
    lb.total_amount,
    lb.pickup_address,
    lb.pickup_lat,
    lb.pickup_lng,
    lb.special_instructions,
    lb.collector_name,
    lb.eta,
    lb.collected_at,
    lb.created_at
  FROM lab_bookings lb
  JOIN lab_tests lt ON lb.test_id = lt.id
  WHERE lb.center_id = p_center_id
  ORDER BY lb.created_at DESC;
$$;

-- Create function for center dashboard metrics
CREATE OR REPLACE FUNCTION get_center_metrics(p_center_id UUID, p_date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days', p_date_to DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_bookings BIGINT,
  pending_bookings BIGINT,
  assigned_bookings BIGINT,
  collected_bookings BIGINT,
  total_revenue NUMERIC,
  pending_revenue NUMERIC,
  collection_rate NUMERIC,
  avg_collection_time INTERVAL
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH booking_stats AS (
    SELECT 
      COUNT(*) as total_bookings,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
      COUNT(CASE WHEN status = 'assigned' OR status = 'en_route' THEN 1 END) as assigned_bookings,
      COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected_bookings,
      SUM(total_amount) as total_revenue,
      SUM(CASE WHEN status != 'collected' THEN total_amount ELSE 0 END) as pending_revenue,
      AVG(CASE WHEN status = 'collected' AND assigned_at IS NOT NULL AND collected_at IS NOT NULL 
          THEN collected_at - assigned_at END) as avg_collection_time
    FROM lab_bookings 
    WHERE center_id = p_center_id 
    AND booking_date BETWEEN p_date_from AND p_date_to
  )
  SELECT 
    total_bookings,
    pending_bookings,
    assigned_bookings,
    collected_bookings,
    COALESCE(total_revenue, 0) as total_revenue,
    COALESCE(pending_revenue, 0) as pending_revenue,
    CASE 
      WHEN total_bookings > 0 THEN ROUND((collected_bookings::NUMERIC / total_bookings::NUMERIC) * 100, 2)
      ELSE 0 
    END as collection_rate,
    avg_collection_time
  FROM booking_stats;
$$;