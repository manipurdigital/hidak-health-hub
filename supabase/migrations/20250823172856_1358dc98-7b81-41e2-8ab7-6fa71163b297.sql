-- Make email optional on profiles to support phone-only signups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
    EXCEPTION WHEN others THEN
      -- ignore if already nullable or constraint not present
      NULL;
    END;
  END IF;
END$$;

-- Ensure user_id is unique so we can safely upsert from the trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- Create a resilient trigger function for auth.users that won't block signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert a minimal profile; allow NULL email for phone signups
  INSERT INTO public.profiles (user_id, email, full_name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', ''),
    NULLIF(NEW.phone, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = NULLIF(EXCLUDED.full_name, '') IS DISTINCT FROM TRUE ? EXCLUDED.full_name : public.profiles.full_name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block user creation on profile errors
  RAISE NOTICE 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;