-- Add missing columns to existing tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
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

-- Update subscription_plans to match expected interface
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS plan_name text;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_consultations integer DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS free_delivery boolean DEFAULT false;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS extra_discount_percentage numeric DEFAULT 0;

-- Update plan_name from name if it's null
UPDATE subscription_plans SET plan_name = name WHERE plan_name IS NULL;

-- Create universal search function
CREATE OR REPLACE FUNCTION universal_search(query_text text, limit_count integer DEFAULT 20)
RETURNS TABLE (
    type text,
    id text,
    title text,
    subtitle text,
    thumbnail_url text,
    price numeric,
    href text,
    group_key text,
    is_alternative boolean,
    composition_match_type text,
    composition_key text,
    composition_family_key text,
    rank_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'medicine'::text as type,
        m.id::text,
        m.name as title,
        m.manufacturer as subtitle,
        m.thumbnail_url,
        m.price,
        ('/medicine/' || m.id) as href,
        m.composition_key as group_key,
        false as is_alternative,
        'exact' as composition_match_type,
        m.composition_key,
        m.composition_family_key,
        1.0 as rank_score
    FROM medicines m
    WHERE m.is_available = true 
    AND m.is_active = true
    AND (
        m.name ILIKE '%' || query_text || '%' 
        OR m.generic_name ILIKE '%' || query_text || '%'
        OR m.manufacturer ILIKE '%' || query_text || '%'
    )
    ORDER BY 
        CASE WHEN m.name ILIKE query_text || '%' THEN 1 ELSE 2 END,
        m.name
    LIMIT limit_count;
END;
$$;

-- Create universal search v2 function
CREATE OR REPLACE FUNCTION universal_search_v2(q text, max_per_group integer DEFAULT 5)
RETURNS TABLE (
    type text,
    id text,
    title text,
    subtitle text,
    thumbnail_url text,
    price numeric,
    href text,
    group_key text,
    is_alternative boolean,
    composition_match_type text,
    composition_key text,
    composition_family_key text,
    rank_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM universal_search(q, max_per_group * 3);
END;
$$;

-- Create generate order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN 'ORD-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
END;
$$;

-- Create cached recommendations functions
CREATE OR REPLACE FUNCTION get_cached_recommendations(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cached_data jsonb;
BEGIN
    SELECT cache_value INTO cached_data
    FROM query_cache
    WHERE cache_key = 'recommendations_' || user_id_param::text
    AND expires_at > now();
    
    RETURN COALESCE(cached_data, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION set_cached_recommendations(user_id_param uuid, recommendations jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO query_cache (cache_key, cache_value, expires_at)
    VALUES (
        'recommendations_' || user_id_param::text,
        recommendations,
        now() + interval '1 hour'
    )
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
        cache_value = recommendations,
        expires_at = now() + interval '1 hour';
END;
$$;

-- Create get_latest_courier_location function
CREATE OR REPLACE FUNCTION get_latest_courier_location(job_type text, job_id uuid)
RETURNS TABLE (
    latitude double precision,
    longitude double precision,
    recorded_at timestamp with time zone,
    accuracy_meters double precision,
    speed_kmh double precision,
    heading_degrees double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.latitude,
        cl.longitude,
        cl.recorded_at,
        cl.accuracy_meters,
        cl.speed_kmh,
        cl.heading_degrees
    FROM courier_locations cl
    JOIN riders r ON r.id = cl.rider_id
    JOIN delivery_assignments da ON da.rider_id = r.id
    WHERE (
        (job_type = 'delivery' AND da.order_id = job_id) OR
        (job_type = 'lab' AND da.order_id = job_id)
    )
    ORDER BY cl.recorded_at DESC
    LIMIT 1;
END;
$$;

-- Create booking tracking functions
CREATE OR REPLACE FUNCTION get_lab_booking_by_token(booking_id uuid, token text)
RETURNS TABLE (
    id uuid,
    status text,
    patient_name text,
    patient_phone text,
    last_eta_mins integer,
    last_distance_meters integer,
    tracking_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lb.id,
        lb.status,
        lb.patient_name,
        lb.patient_phone,
        lb.last_eta_mins,
        lb.last_distance_meters,
        lb.tracking_token
    FROM lab_bookings lb
    WHERE lb.id = booking_id AND lb.tracking_token = token;
END;
$$;

CREATE OR REPLACE FUNCTION get_order_by_token(order_id uuid, token text)
RETURNS TABLE (
    id uuid,
    status text,
    shipping_address text,
    last_eta_mins integer,
    last_distance_meters integer,
    tracking_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.status,
        o.shipping_address,
        0 as last_eta_mins,
        0 as last_distance_meters,
        '' as tracking_token
    FROM orders o
    WHERE o.id = order_id;
END;
$$;

-- Create notification function
CREATE OR REPLACE FUNCTION create_booking_notification(
    event_type text,
    booking_id uuid,
    title text,
    message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder function for notification creation
    -- In a real implementation, this would create notifications
    -- based on the event type and booking information
    NULL;
END;
$$;

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_logs_updated_at
    BEFORE UPDATE ON performance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_partners_updated_at
    BEFORE UPDATE ON delivery_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires_at ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_courier_locations_rider_id ON courier_locations(rider_id);
CREATE INDEX IF NOT EXISTS idx_courier_locations_recorded_at ON courier_locations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_medicines_search ON medicines USING gin((name || ' ' || COALESCE(generic_name, '') || ' ' || COALESCE(manufacturer, '')));

-- Ensure order_number is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number) WHERE order_number IS NOT NULL;