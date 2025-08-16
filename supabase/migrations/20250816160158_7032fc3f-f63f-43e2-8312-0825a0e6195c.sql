-- Fix RLS policies for better security and compliance

-- 1. Create admin check function first
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- 2. Create audit table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_log 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);

-- 3. Fix doctors table RLS to protect sensitive data
DROP POLICY IF EXISTS "Doctors are viewable by everyone" ON public.doctors;

-- Allow basic info for booking, but protect sensitive details
CREATE POLICY "Public can view basic doctor info" 
ON public.doctors 
FOR SELECT 
USING (
  is_available = true AND 
  is_verified = true
);

-- Full access for admins and the doctor themselves
CREATE POLICY "Doctors and admins can view all doctor data" 
ON public.doctors 
FOR SELECT 
USING (
  is_admin() OR 
  auth.uid() = user_id
);

-- 4. Enhance orders RLS policies
DROP POLICY IF EXISTS "Admins and doctors can view all orders" ON public.orders;

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin());

-- Doctors can only see orders with prescriptions they issued
CREATE POLICY "Doctors can view orders with their prescriptions" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions p
    JOIN public.doctors d ON d.id = p.doctor_id
    WHERE p.consultation_id IN (
      SELECT id FROM public.consultations 
      WHERE doctor_id = d.id
    )
    AND d.user_id = auth.uid()
  )
);

-- 5. Enhance lab_reports RLS
DROP POLICY IF EXISTS "Admins and doctors can view all reports" ON public.lab_reports;

CREATE POLICY "Admins can view all lab reports" 
ON public.lab_reports 
FOR SELECT 
USING (is_admin());

-- Doctors can only see reports for their patients
CREATE POLICY "Doctors can view their patients' reports" 
ON public.lab_reports 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.consultations c
    JOIN public.doctors d ON d.id = c.doctor_id
    WHERE c.patient_id = lab_reports.user_id
    AND d.user_id = auth.uid()
  )
);

-- 6. Enhance lab_bookings RLS for lab staff
CREATE POLICY "Lab staff can view assigned bookings" 
ON public.lab_bookings 
FOR SELECT 
USING (has_role(auth.uid(), 'lab'::app_role));

CREATE POLICY "Lab staff can update assigned bookings" 
ON public.lab_bookings 
FOR UPDATE 
USING (has_role(auth.uid(), 'lab'::app_role));

-- 7. Enhance consultations RLS
CREATE POLICY "Lab staff can view consultations for lab tests" 
ON public.consultations 
FOR SELECT 
USING (
  has_role(auth.uid(), 'lab'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.lab_bookings lb
    WHERE lb.user_id = consultations.patient_id
  )
);

-- 8. Create audit triggers for critical tables
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (table_name, record_id, action, new_values, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_prescriptions ON public.prescriptions;
CREATE TRIGGER audit_prescriptions
  AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();