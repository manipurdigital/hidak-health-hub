-- Create required tables to match frontend expectations
-- 1) Diagnostic Centers
CREATE TABLE IF NOT EXISTS public.diagnostic_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  contact_phone TEXT,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  platform_commission_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_centers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diagnostic_centers' AND policyname = 'Anyone can view active diagnostic centers'
  ) THEN
    CREATE POLICY "Anyone can view active diagnostic centers"
      ON public.diagnostic_centers
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diagnostic_centers' AND policyname = 'Admins can manage diagnostic centers'
  ) THEN
    CREATE POLICY "Admins can manage diagnostic centers"
      ON public.diagnostic_centers
      FOR ALL
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_diagnostic_centers_updated_at'
  ) THEN
    CREATE TRIGGER update_diagnostic_centers_updated_at
    BEFORE UPDATE ON public.diagnostic_centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- 2) Center Staff (links users to diagnostic centers with roles)
CREATE TABLE IF NOT EXISTS public.center_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.diagnostic_centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(center_id, user_id)
);

ALTER TABLE public.center_staff ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'center_staff' AND policyname = 'Admins manage center_staff'
  ) THEN
    CREATE POLICY "Admins manage center_staff"
      ON public.center_staff
      FOR ALL
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'center_staff' AND policyname = 'Users can view their own center assignments'
  ) THEN
    CREATE POLICY "Users can view their own center assignments"
      ON public.center_staff
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;


-- 3) Geofences
CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL, -- 'delivery' | 'lab_collection'
  polygon JSONB NOT NULL,     -- coordinates array
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'geofences' AND policyname = 'Geofences are viewable by everyone'
  ) THEN
    CREATE POLICY "Geofences are viewable by everyone"
      ON public.geofences
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'geofences' AND policyname = 'Admins can manage geofences'
  ) THEN
    CREATE POLICY "Admins can manage geofences"
      ON public.geofences
      FOR ALL
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_geofences_updated_at'
  ) THEN
    CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON public.geofences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- 4) Riders
CREATE TABLE IF NOT EXISTS public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'riders' AND policyname = 'Admins can manage riders'
  ) THEN
    CREATE POLICY "Admins can manage riders"
      ON public.riders
      FOR ALL
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'riders' AND policyname = 'Riders can view own profile'
  ) THEN
    CREATE POLICY "Riders can view own profile"
      ON public.riders
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'riders' AND policyname = 'Riders can update own profile'
  ) THEN
    CREATE POLICY "Riders can update own profile"
      ON public.riders
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_riders_updated_at'
  ) THEN
    CREATE TRIGGER update_riders_updated_at
    BEFORE UPDATE ON public.riders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- 5) Delivery Assignments
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'delivery_assignments' AND policyname = 'Admins can manage delivery assignments'
  ) THEN
    CREATE POLICY "Admins can manage delivery assignments"
      ON public.delivery_assignments
      FOR ALL
      USING (get_current_user_role() = 'admin'::app_role)
      WITH CHECK (get_current_user_role() = 'admin'::app_role);
  END IF;
END $$;

-- Order owners can view their assignment
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'delivery_assignments' AND policyname = 'Users can view their own delivery assignments'
  ) THEN
    CREATE POLICY "Users can view their own delivery assignments"
      ON public.delivery_assignments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.id = delivery_assignments.order_id AND o.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Assigned rider can view/update their assignment
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'delivery_assignments' AND policyname = 'Assigned rider can view delivery assignment'
  ) THEN
    CREATE POLICY "Assigned rider can view delivery assignment"
      ON public.delivery_assignments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.riders r
          WHERE r.id = delivery_assignments.rider_id AND r.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'delivery_assignments' AND policyname = 'Assigned rider can update delivery assignment'
  ) THEN
    CREATE POLICY "Assigned rider can update delivery assignment"
      ON public.delivery_assignments
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.riders r
          WHERE r.id = delivery_assignments.rider_id AND r.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.riders r
          WHERE r.id = delivery_assignments.rider_id AND r.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_assignments_updated_at'
  ) THEN
    CREATE TRIGGER update_delivery_assignments_updated_at
    BEFORE UPDATE ON public.delivery_assignments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- 6) User Consents
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'location' | 'marketing' | 'cookies'
  granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'Users can view their own consents'
  ) THEN
    CREATE POLICY "Users can view their own consents"
      ON public.user_consents
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'Users can upsert their consents'
  ) THEN
    CREATE POLICY "Users can upsert their consents"
      ON public.user_consents
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_consents' AND policyname = 'Users can update their consents'
  ) THEN
    CREATE POLICY "Users can update their consents"
      ON public.user_consents
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_consents_updated_at'
  ) THEN
    CREATE TRIGGER update_user_consents_updated_at
    BEFORE UPDATE ON public.user_consents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
