-- Create categories table for medicine organization
CREATE TABLE public.medicine_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category_id UUID REFERENCES public.medicine_categories(id),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percentage INTEGER DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  requires_prescription BOOLEAN DEFAULT false,
  fast_delivery BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  manufacturer TEXT,
  dosage TEXT,
  form TEXT, -- tablet, capsule, syrup, etc.
  pack_size TEXT,
  expiry_date DATE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create orders table for checkout
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  prescription_required BOOLEAN DEFAULT false,
  prescription_url TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create order_items table for order details
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  medicine_id UUID REFERENCES public.medicines(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Enable RLS
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for medicine_categories (public read)
CREATE POLICY "Categories are viewable by everyone"
ON public.medicine_categories
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.medicine_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for medicines (public read)
CREATE POLICY "Medicines are viewable by everyone"
ON public.medicines
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage medicines"
ON public.medicines
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and doctors can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'doctor')
);

-- RLS policies for order_items
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order items for their orders"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Storage policies for prescriptions
CREATE POLICY "Users can upload their own prescriptions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Doctors and admins can view all prescriptions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND 
  (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'))
);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  order_num TEXT;
BEGIN
  order_num := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0');
  RETURN order_num;
END;
$$;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Add updated_at triggers
CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.medicine_categories (name, description, icon) VALUES
('Pain Relief', 'Medicines for pain management', '🩹'),
('Diabetes Care', 'Blood sugar management', '🩸'),
('Heart Care', 'Cardiovascular health', '❤️'),
('Vitamins', 'Nutritional supplements', '💊'),
('Antibiotics', 'Infection treatment', '🔬'),
('Women''s Health', 'Female healthcare products', '👩');

-- Insert sample medicines
INSERT INTO public.medicines (name, brand, category_id, description, price, original_price, discount_percentage, stock_quantity, requires_prescription, fast_delivery, rating, review_count, manufacturer, dosage, form, pack_size) VALUES
('Paracetamol 500mg', 'Crocin', (SELECT id FROM medicine_categories WHERE name = 'Pain Relief'), 'Effective pain relief and fever reducer', 24.00, 30.00, 20, 100, false, true, 4.5, 1250, 'GSK', '500mg', 'Tablet', '10 tablets'),
('Metformin 500mg', 'Glycomet', (SELECT id FROM medicine_categories WHERE name = 'Diabetes Care'), 'Blood sugar control medication', 45.00, 52.00, 13, 50, true, false, 4.6, 2100, 'USV Ltd', '500mg', 'Tablet', '15 tablets'),
('Vitamin D3 60k IU', 'HealthVit', (SELECT id FROM medicine_categories WHERE name = 'Vitamins'), 'Bone health supplement', 185.00, 220.00, 16, 75, false, true, 4.3, 890, 'HealthVit', '60000 IU', 'Capsule', '4 capsules'),
('Omeprazole 20mg', 'Omez', (SELECT id FROM medicine_categories WHERE name = 'Pain Relief'), 'Acid reflux treatment', 35.00, 42.00, 17, 80, false, true, 4.4, 967, 'Dr. Reddy''s', '20mg', 'Capsule', '14 capsules'),
('Amoxicillin 250mg', 'Novamox', (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'), 'Antibiotic for bacterial infections', 65.00, 75.00, 13, 30, true, false, 4.7, 543, 'Cipla', '250mg', 'Capsule', '10 capsules');