-- Add pickup location fields to lab_bookings
ALTER TABLE public.lab_bookings 
ADD COLUMN pickup_lat double precision,
ADD COLUMN pickup_lng double precision,
ADD COLUMN pickup_address jsonb;

-- Create admin assignment RPC function
CREATE OR REPLACE FUNCTION public.assign_lab_booking_admin(
  p_booking_id uuid,
  p_center_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_booking jsonb;
BEGIN
  -- Check if user has admin access
  IF NOT public.has_admin_access(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Update the booking
  UPDATE public.lab_bookings 
  SET 
    center_id = p_center_id,
    status = 'assigned',
    assigned_at = now(),
    collector_name = COALESCE(p_notes, collector_name)
  WHERE id = p_booking_id
  RETURNING to_jsonb(lab_bookings.*) INTO updated_booking;

  IF updated_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found or could not be updated';
  END IF;

  -- Create notification for assignment
  PERFORM public.create_booking_notification(
    'booking_assigned',
    p_booking_id,
    'Lab Test Assigned',
    'A lab test has been assigned to your center'
  );

  RETURN updated_booking;
END;
$$;

-- Update create_booking_notification function to handle center notifications properly
CREATE OR REPLACE FUNCTION public.create_booking_notification(event_type text, booking_id uuid, title text, message text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_user RECORD;
  center_user RECORD;
  booking_record RECORD;
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

    WHEN 'booking_assigned' THEN
      -- Notify center staff for the assigned center only
      IF booking_record.center_id IS NOT NULL THEN
        FOR center_user IN 
          SELECT DISTINCT cs.user_id 
          FROM center_staff cs 
          WHERE cs.center_id = booking_record.center_id 
            AND cs.is_active = true
        LOOP
          INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
          VALUES (center_user.user_id, title, message, 'success', event_type, booking_id);
        END LOOP;
      END IF;

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
      -- Notify all admins and the customer
      FOR admin_user IN 
        SELECT DISTINCT ur.user_id 
        FROM user_roles ur 
        WHERE ur.role = 'admin'
      LOOP
        INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
        VALUES (admin_user.user_id, title, message, 'warning', event_type, booking_id);
      END LOOP;
      
      INSERT INTO notifications (user_id, title, message, type, event_type, related_id)
      VALUES (booking_record.user_id, title, message, 'warning', event_type, booking_id);
  END CASE;
END;
$$;

-- Create trigger for booking creation notifications
CREATE OR REPLACE FUNCTION public.trigger_booking_created_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger on INSERT
  PERFORM public.create_booking_notification(
    'booking_created',
    NEW.id,
    'New Lab Booking',
    'A new lab test booking has been created and needs assignment'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for booking assignment notifications  
CREATE OR REPLACE FUNCTION public.trigger_booking_assigned_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger when center_id changes from NULL to NOT NULL
  IF OLD.center_id IS NULL AND NEW.center_id IS NOT NULL THEN
    PERFORM public.create_booking_notification(
      'booking_assigned',
      NEW.id,
      'Lab Test Assigned',
      'A lab test has been assigned to your center'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS notify_booking_created ON public.lab_bookings;
DROP TRIGGER IF EXISTS notify_booking_assigned ON public.lab_bookings;

-- Create the triggers
CREATE TRIGGER notify_booking_created
  AFTER INSERT ON public.lab_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_created_notification();

CREATE TRIGGER notify_booking_assigned
  AFTER UPDATE ON public.lab_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_booking_assigned_notification();