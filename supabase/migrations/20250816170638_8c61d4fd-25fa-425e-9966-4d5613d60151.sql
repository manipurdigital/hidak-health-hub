-- Create storage policies for prescription uploads
CREATE POLICY "Users can upload their own prescriptions" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescriptions" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all prescriptions" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'prescriptions' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);