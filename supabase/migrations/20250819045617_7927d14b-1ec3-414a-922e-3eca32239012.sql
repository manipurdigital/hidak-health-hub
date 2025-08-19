-- Create storage bucket for HTML audit snapshots
INSERT INTO storage.buckets (id, name, public) VALUES ('sources', 'sources', false);

-- Create policies for sources bucket
CREATE POLICY "Admins can view source files" ON storage.objects 
FOR SELECT USING (bucket_id = 'sources' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

CREATE POLICY "Admins can upload source files" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'sources' AND auth.uid() IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
));

-- Add source tracking fields to medicines table if not already present
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS external_source_url text,
ADD COLUMN IF NOT EXISTS external_source_domain text,
ADD COLUMN IF NOT EXISTS source_last_fetched timestamp with time zone,
ADD COLUMN IF NOT EXISTS source_checksum text,
ADD COLUMN IF NOT EXISTS source_attribution text;