-- Create tables for partner applications
CREATE TABLE public.lab_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  center_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  
  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Business Information
  license_number TEXT NOT NULL,
  gst_number TEXT,
  established_year TEXT,
  center_type TEXT NOT NULL,
  
  -- Services & Capabilities
  operating_hours TEXT,
  services_offered TEXT[],
  home_collection BOOLEAN DEFAULT false,
  emergency_services BOOLEAN DEFAULT false,
  
  -- Documents (stored as URLs after upload)
  license_document_url TEXT,
  gst_document_url TEXT,
  other_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pharmacy_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Information
  pharmacy_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  
  -- Address Information
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  
  -- Business Information
  license_number TEXT NOT NULL,
  gst_number TEXT,
  established_year TEXT,
  pharmacy_type TEXT NOT NULL,
  
  -- Services & Capabilities
  operating_hours TEXT,
  services_offered TEXT[],
  home_delivery BOOLEAN DEFAULT false,
  prescription_only BOOLEAN DEFAULT false,
  
  -- Documents (stored as URLs after upload)
  license_document_url TEXT,
  gst_document_url TEXT,
  other_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  emergency_contact TEXT,
  
  -- Address Information
  current_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  
  -- Vehicle Information
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  driving_license_number TEXT NOT NULL,
  vehicle_insurance TEXT,
  
  -- Documents (stored as URLs after upload)
  aadhar_card_url TEXT,
  driving_license_url TEXT,
  vehicle_rc_url TEXT,
  insurance_document_url TEXT,
  
  -- Experience & Preferences
  experience TEXT,
  preferred_areas TEXT,
  availability TEXT,
  
  -- Bank Details
  bank_account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partner_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lab_applications
CREATE POLICY "Users can view their own applications" 
ON public.lab_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.lab_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all lab applications" 
ON public.lab_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lab applications" 
ON public.lab_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pharmacy_applications
CREATE POLICY "Users can view their own pharmacy applications" 
ON public.pharmacy_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pharmacy applications" 
ON public.pharmacy_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all pharmacy applications" 
ON public.pharmacy_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pharmacy applications" 
ON public.pharmacy_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for delivery_partner_applications
CREATE POLICY "Users can view their own delivery applications" 
ON public.delivery_partner_applications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own delivery applications" 
ON public.delivery_partner_applications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all delivery applications" 
ON public.delivery_partner_applications 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update delivery applications" 
ON public.delivery_partner_applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_applications_updated_at
BEFORE UPDATE ON public.lab_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_applications_updated_at
BEFORE UPDATE ON public.pharmacy_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_partner_applications_updated_at
BEFORE UPDATE ON public.delivery_partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();