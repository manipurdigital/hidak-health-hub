-- Add missing columns to existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address text;

ALTER TABLE center_staff ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS full_name text;

ALTER TABLE lab_bookings ADD COLUMN IF NOT EXISTS patient_name text;
ALTER TABLE lab_bookings ADD COLUMN IF NOT EXISTS patient_phone text;
ALTER TABLE lab_bookings ADD COLUMN IF NOT EXISTS last_eta_mins integer;
ALTER TABLE lab_bookings ADD COLUMN IF NOT EXISTS last_distance_meters integer;
ALTER TABLE lab_bookings ADD COLUMN IF NOT EXISTS tracking_token text;

ALTER TABLE consultations ADD COLUMN IF NOT EXISTS total_amount numeric;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS time_slot text;

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS prescription_number text;

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS composition_key text;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS composition_family_key text;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS thumbnail_url text;

ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS rider_code text;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS rider_name text;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS customer_address jsonb;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS notes text;

-- Update subscription_plans to match expected interface
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS plan_name text;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_consultations integer DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS free_delivery boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS extra_discount_percentage numeric DEFAULT 0;

-- Update plan_name from name if it's null
UPDATE subscription_plans SET plan_name = name WHERE plan_name IS NULL;

-- Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    address_line_1 text NOT NULL,
    address_line_2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'India',
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for addresses
CREATE POLICY "Users can manage their own addresses" ON addresses
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create performance_logs table
CREATE TABLE IF NOT EXISTS performance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint text NOT NULL,
    method text NOT NULL,
    response_time_ms integer NOT NULL,
    status_code integer NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on performance_logs
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance_logs
CREATE POLICY "Admins can view performance logs" ON performance_logs
FOR SELECT USING (get_current_user_role() = 'admin'::app_role);

-- Create query_cache table
CREATE TABLE IF NOT EXISTS query_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key text UNIQUE NOT NULL,
    cache_value jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on query_cache
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for query_cache
CREATE POLICY "Anyone can read cache" ON query_cache
FOR SELECT USING (true);

CREATE POLICY "System can manage cache" ON query_cache
FOR ALL USING (true)
WITH CHECK (true);

-- Create courier_locations table
CREATE TABLE IF NOT EXISTS courier_locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id uuid REFERENCES riders(id),
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    recorded_at timestamp with time zone DEFAULT now(),
    accuracy_meters double precision,
    speed_kmh double precision,
    heading_degrees double precision,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on courier_locations
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courier_locations
CREATE POLICY "Riders can insert their own locations" ON courier_locations
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM riders r 
        WHERE r.id = courier_locations.rider_id 
        AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view courier locations" ON courier_locations
FOR SELECT USING (true);

-- Create delivery_partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    vehicle_type text NOT NULL,
    license_number text,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on delivery_partners
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for delivery_partners
CREATE POLICY "Partners can manage their own profile" ON delivery_partners
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage delivery partners" ON delivery_partners
FOR ALL USING (get_current_user_role() = 'admin'::app_role)
WITH CHECK (get_current_user_role() = 'admin'::app_role);