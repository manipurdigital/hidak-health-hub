-- Create thumbnails bucket for public read access
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Update RLS policies for prescriptions bucket
DROP POLICY IF EXISTS "Users can upload their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own prescriptions" ON storage.objects;

-- Prescriptions bucket policies (private)
CREATE POLICY "Users can upload their own prescriptions" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescriptions" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own prescriptions" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own prescriptions" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Lab reports bucket policies (private)
DROP POLICY IF EXISTS "Users can upload their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own lab reports" ON storage.objects;

CREATE POLICY "Users can upload their own lab reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lab-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own lab reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lab-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own lab reports" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lab-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own lab reports" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lab-reports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Thumbnails bucket policies (public read)
DROP POLICY IF EXISTS "Thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;

CREATE POLICY "Thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);