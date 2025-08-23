-- Make email optional on profiles to support phone-only signups
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  EXCEPTION WHEN duplicate_table THEN
    -- Constraint already exists
    NULL;
  END;
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
    full_name = CASE 
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name != '' 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block user creation on profile errors
  RAISE NOTICE 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();