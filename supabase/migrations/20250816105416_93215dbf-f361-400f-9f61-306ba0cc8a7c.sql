-- Make manipurdigital2025@gmail.com an admin
-- First, let's find the user ID for this email
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID from auth.users table
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'manipurdigital2025@gmail.com';
    
    -- If user exists, add admin role
    IF target_user_id IS NOT NULL THEN
        -- Remove any existing roles for this user first
        DELETE FROM public.user_roles WHERE user_id = target_user_id;
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role, assigned_by) 
        VALUES (target_user_id, 'admin', target_user_id);
        
        RAISE NOTICE 'Admin role assigned to user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User with email manipurdigital2025@gmail.com not found';
    END IF;
END $$;