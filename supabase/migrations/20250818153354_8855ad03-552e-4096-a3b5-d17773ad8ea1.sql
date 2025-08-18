-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  event_type TEXT NOT NULL, -- booking_created, booking_assigned, status_en_route, etc.
  related_id UUID, -- booking_id, order_id, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  booking_created_email BOOLEAN NOT NULL DEFAULT true,
  booking_assigned_email BOOLEAN NOT NULL DEFAULT true,
  status_updates_email BOOLEAN NOT NULL DEFAULT true,
  reschedule_requests_email BOOLEAN NOT NULL DEFAULT true,
  booking_created_sms BOOLEAN NOT NULL DEFAULT false,
  booking_assigned_sms BOOLEAN NOT NULL DEFAULT false,
  status_updates_sms BOOLEAN NOT NULL DEFAULT false,
  reschedule_requests_sms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for notification preferences
CREATE POLICY "Users can view their own preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notifications for booking events
CREATE OR REPLACE FUNCTION public.create_booking_notification(
  event_type TEXT,
  booking_id UUID,
  title TEXT,
  message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  center_user RECORD;
  booking_record RECORD;
  patient_id UUID;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record FROM lab_bookings WHERE id = booking_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Handle different event types
  CASE event_type
    WHEN 'booking_created' THEN
      -- Notify all admins
      FOR admin_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role = 'admin'
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (admin_user.user_id, title, message, 'info', event_type, booking_id);
      END LOOP;
      
      -- Notify centers covering the pincode (for now, notify all center users)
      FOR center_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role IN ('center', 'center_staff')
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (center_user.user_id, title, message, 'info', event_type, booking_id);
      END LOOP;

    WHEN 'booking_assigned' THEN
      -- Notify center users
      FOR center_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role IN ('center', 'center_staff')
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (center_user.user_id, title, message, 'success', event_type, booking_id);
      END LOOP;

    WHEN 'status_en_route', 'status_collected' THEN
      -- Notify all admins
      FOR admin_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role = 'admin'
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (admin_user.user_id, title, message, 'info', event_type, booking_id);
      END LOOP;

    WHEN 'reschedule_requested' THEN
      -- Notify all admins
      FOR admin_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role = 'admin'
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (admin_user.user_id, title, message, 'warning', event_type, booking_id);
      END LOOP;
      
      -- Notify the customer/patient
      INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
      VALUES (booking_record.user_id, title, message, 'warning', event_type, booking_id);
  END CASE;
END;
$$;

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;