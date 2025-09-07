-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address JSONB,
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  customer_gender TEXT,
  services TEXT[] NOT NULL, -- Array of selected services: 'medicine', 'lab', 'consultation'
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  total_estimated_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_request_items table
CREATE TABLE public.service_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'medicine', 'lab', 'consultation'
  item_type TEXT NOT NULL, -- 'medicine_name', 'test_name', 'consultation_specialty', 'consultation_symptom'
  item_value TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_request_files table
CREATE TABLE public.service_request_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'prescription', 'report', 'other'
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for intake uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('intake-uploads', 'intake-uploads', false);

-- Enable RLS on all tables
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_requests
CREATE POLICY "Users can create their own service requests" 
ON public.service_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own service requests" 
ON public.service_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all service requests" 
ON public.service_requests 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

CREATE POLICY "Admins can update all service requests" 
ON public.service_requests 
FOR UPDATE 
USING (get_current_user_role() = 'admin'::app_role);

-- RLS policies for service_request_items
CREATE POLICY "Users can create items for their service requests" 
ON public.service_request_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.service_requests sr 
  WHERE sr.id = service_request_items.request_id 
  AND (sr.user_id = auth.uid() OR sr.user_id IS NULL)
));

CREATE POLICY "Users can view items for their service requests" 
ON public.service_request_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.service_requests sr 
  WHERE sr.id = service_request_items.request_id 
  AND sr.user_id = auth.uid()
));

CREATE POLICY "Admins can view all service request items" 
ON public.service_request_items 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

-- RLS policies for service_request_files
CREATE POLICY "Users can create files for their service requests" 
ON public.service_request_files 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.service_requests sr 
  WHERE sr.id = service_request_files.request_id 
  AND (sr.user_id = auth.uid() OR sr.user_id IS NULL)
));

CREATE POLICY "Users can view files for their service requests" 
ON public.service_request_files 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.service_requests sr 
  WHERE sr.id = service_request_files.request_id 
  AND sr.user_id = auth.uid()
));

CREATE POLICY "Admins can view all service request files" 
ON public.service_request_files 
FOR SELECT 
USING (get_current_user_role() = 'admin'::app_role);

-- Storage policies for intake-uploads bucket
CREATE POLICY "Users can upload files for their requests" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'intake-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view files for their requests" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'intake-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all intake files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'intake-uploads' AND get_current_user_role() = 'admin'::app_role);

-- Add trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();