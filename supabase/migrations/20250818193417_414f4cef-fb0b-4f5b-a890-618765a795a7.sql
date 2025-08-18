-- Add missing columns to medicines table for import functionality
ALTER TABLE public.medicines 
ADD COLUMN IF NOT EXISTS external_source_url text,
ADD COLUMN IF NOT EXISTS external_source_domain text,
ADD COLUMN IF NOT EXISTS source_attribution text,
ADD COLUMN IF NOT EXISTS source_checksum text,
ADD COLUMN IF NOT EXISTS source_last_fetched timestamptz,
ADD COLUMN IF NOT EXISTS original_image_url text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS image_hash text;

-- Create import_jobs table to track bulk import operations
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text CHECK (kind IN ('medicine_url', 'medicine_csv')),
  status text DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  summary jsonb DEFAULT '{}'::jsonb
);

-- Create import_job_items table to track individual items in bulk imports
CREATE TABLE IF NOT EXISTS public.import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  source_url text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  error text,
  created_medicine_id uuid REFERENCES public.medicines(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_jobs
CREATE POLICY "Admins can manage all import jobs" 
ON public.import_jobs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own import jobs" 
ON public.import_jobs 
FOR SELECT 
USING (auth.uid() = created_by);

-- RLS policies for import_job_items
CREATE POLICY "Admins can manage all import job items" 
ON public.import_job_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view items from their own import jobs" 
ON public.import_job_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.import_jobs 
  WHERE import_jobs.id = import_job_items.job_id 
  AND import_jobs.created_by = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_external_source_url ON public.medicines(external_source_url);
CREATE INDEX IF NOT EXISTS idx_medicines_source_checksum ON public.medicines(source_checksum);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON public.import_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_job_items_job_id ON public.import_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_import_job_items_status ON public.import_job_items(status);

-- Add trigger to update updated_at on import_jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_jobs_updated_at
    BEFORE UPDATE ON public.import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_job_items_updated_at
    BEFORE UPDATE ON public.import_job_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();