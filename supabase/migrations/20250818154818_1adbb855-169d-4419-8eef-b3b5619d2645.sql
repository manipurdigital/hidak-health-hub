-- Add missing fields to lab_bookings if they don't exist
DO $$ 
BEGIN
  -- Add center_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_bookings' AND column_name = 'center_id'
  ) THEN
    ALTER TABLE public.lab_bookings ADD COLUMN center_id UUID;
  END IF;

  -- Add assigned_at if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_bookings' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE public.lab_bookings ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add center_payout_rate if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_bookings' AND column_name = 'center_payout_rate'
  ) THEN
    ALTER TABLE public.lab_bookings ADD COLUMN center_payout_rate NUMERIC DEFAULT 0.30;
  END IF;

  -- Add center_payout_amount if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lab_bookings' AND column_name = 'center_payout_amount'
  ) THEN
    ALTER TABLE public.lab_bookings ADD COLUMN center_payout_amount NUMERIC;
  END IF;
END $$;

-- Create center_staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.center_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(center_id, user_id)
);

-- Enable RLS on center_staff if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'center_staff') THEN
    ALTER TABLE public.center_staff ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;