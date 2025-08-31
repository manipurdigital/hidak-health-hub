-- =====================================================
-- COMPREHENSIVE DATABASE CORRUPTION FIX
-- Fix all missing columns, functions, and RLS issues
-- =====================================================

-- 1. Add missing columns to medicines table
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Add missing columns to lab_tests table  
ALTER TABLE public.lab_tests
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 3. Add missing columns to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- 4. Add missing columns to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

-- 5. Fix the infinite recursion issue in user_roles RLS by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'user'::app_role
  );
$$;

-- 6. Drop and recreate user_roles policies to fix infinite recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create fixed policies using the security definer function
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- 7. Create the missing recommend_medicines_for_time function
CREATE OR REPLACE FUNCTION public.recommend_medicines_for_time(
  at_ts timestamp with time zone,
  in_city text DEFAULT NULL,
  in_pincode text DEFAULT NULL,
  top_n integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  price numeric,
  discount_price numeric,
  image_url text,
  manufacturer text,
  score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple time-based recommendations based on common patterns
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.price,
    m.discount_price,
    m.image_url,
    m.manufacturer,
    -- Simple scoring based on time and availability
    CASE 
      WHEN EXTRACT(hour FROM at_ts) BETWEEN 6 AND 10 THEN 
        CASE WHEN m.name ILIKE '%vitamin%' OR m.name ILIKE '%supplement%' THEN 2.0 ELSE 1.0 END
      WHEN EXTRACT(hour FROM at_ts) BETWEEN 18 AND 22 THEN
        CASE WHEN m.name ILIKE '%pain%' OR m.name ILIKE '%fever%' THEN 2.0 ELSE 1.0 END
      ELSE 1.0
    END as score
  FROM public.medicines m
  WHERE m.is_available = true 
    AND m.is_active = true
    AND m.stock_quantity > 0
  ORDER BY score DESC, m.created_at DESC
  LIMIT top_n;
END;
$$;

-- 8. Create admin access check function to fix other issues
CREATE OR REPLACE FUNCTION public.has_admin_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'::app_role
  );
$$;

-- 9. Add missing RLS policies for tables without them
-- Centers table policies
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available centers" ON public.centers
FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage centers" ON public.centers
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Delivery centers table policies  
ALTER TABLE public.delivery_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available delivery centers" ON public.delivery_centers
FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage delivery centers" ON public.delivery_centers
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Doctor availability table policies
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability
FOR SELECT USING (is_available = true);

CREATE POLICY "Doctors can manage their own availability" ON public.doctor_availability
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.doctors d 
    WHERE d.id = doctor_availability.doctor_id 
    AND d.user_id = auth.uid()
  )
);

-- Doctors table policies
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified doctors" ON public.doctors
FOR SELECT USING (is_available = true AND is_verified = true);

CREATE POLICY "Doctors can manage their own profile" ON public.doctors
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all doctors" ON public.doctors
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Lab tests table policies
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available lab tests" ON public.lab_tests
FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage lab tests" ON public.lab_tests
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Medicine categories table policies
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicine categories" ON public.medicine_categories
FOR SELECT USING (true);

CREATE POLICY "Admins can manage medicine categories" ON public.medicine_categories
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Notification preferences table policies
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON public.notification_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification templates table policies
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active notification templates" ON public.notification_templates
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Subscription plans table policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
FOR ALL USING (public.get_current_user_role() = 'admin'::app_role);

-- Subscription usage table policies
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription usage" ON public.subscription_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions us 
    WHERE us.id = subscription_usage.subscription_id 
    AND us.user_id = auth.uid()
  )
);

-- User subscriptions table policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- Lab reports table policies
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lab reports" ON public.lab_reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lab_bookings lb 
    WHERE lb.id = lab_reports.booking_id 
    AND lb.user_id = auth.uid()
  )
);

-- Prescriptions table policies
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prescriptions" ON public.prescriptions
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their prescriptions" ON public.prescriptions
FOR UPDATE USING (auth.uid() = doctor_id);

-- 10. Update indexes for performance
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON public.medicines(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medicines_availability ON public.medicines(is_available, is_active) WHERE is_available = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON public.doctors(is_verified, is_available) WHERE is_verified = true AND is_available = true;
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON public.lab_tests(is_active) WHERE is_active = true;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Update any existing records to have proper default values
UPDATE public.medicines SET is_active = true WHERE is_active IS NULL;
UPDATE public.lab_tests SET is_active = true WHERE is_active IS NULL;
UPDATE public.doctors SET is_verified = false WHERE is_verified IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'DATABASE CORRUPTION FIX COMPLETED';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Fixed issues:';
  RAISE NOTICE '1. Added missing is_active columns';
  RAISE NOTICE '2. Added missing is_verified columns';
  RAISE NOTICE '3. Added missing current_period_end column';
  RAISE NOTICE '4. Fixed infinite recursion in user_roles RLS';
  RAISE NOTICE '5. Created missing recommend_medicines_for_time function';
  RAISE NOTICE '6. Added comprehensive RLS policies';
  RAISE NOTICE '7. Added performance indexes';
  RAISE NOTICE '======================================';
END $$;