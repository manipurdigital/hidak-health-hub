-- Add admin policy for lab_bookings to allow admin users to view all lab bookings
CREATE POLICY "Admins can view all lab bookings" 
ON lab_bookings 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

-- Add admin policy for lab_bookings to allow admin users to update all lab bookings
CREATE POLICY "Admins can update all lab bookings" 
ON lab_bookings 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::app_role);