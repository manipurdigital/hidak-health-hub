
-- 1) Import job tables used by bulk-import-medicines

-- Create table: import_jobs
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('medicine_csv', 'medicine_url')),
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NULL,
  summary jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trg_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER trg_import_jobs_updated_at
BEFORE UPDATE ON public.import_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table: import_job_items
CREATE TABLE IF NOT EXISTS public.import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  source_url text NULL,
  payload jsonb NULL,
  status text NOT NULL DEFAULT 'pending',
  error text NULL,
  created_medicine_id uuid NULL REFERENCES public.medicines(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index to query items by job
CREATE INDEX IF NOT EXISTS idx_import_job_items_job_id ON public.import_job_items(job_id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trg_import_job_items_updated_at ON public.import_job_items;
CREATE TRIGGER trg_import_job_items_updated_at
BEFORE UPDATE ON public.import_job_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) RLS and policies

-- Enable RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_job_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage all import jobs
DROP POLICY IF EXISTS "Admins can manage import_jobs" ON public.import_jobs;
CREATE POLICY "Admins can manage import_jobs"
  ON public.import_jobs
  FOR ALL
  USING (get_current_user_role() = 'admin'::app_role)
  WITH CHECK (get_current_user_role() = 'admin'::app_role);

-- Admins can manage import job items
DROP POLICY IF EXISTS "Admins can manage import_job_items" ON public.import_job_items;
CREATE POLICY "Admins can manage import_job_items"
  ON public.import_job_items
  FOR ALL
  USING (get_current_user_role() = 'admin'::app_role)
  WITH CHECK (get_current_user_role() = 'admin'::app_role);

-- Creators can see their own jobs
DROP POLICY IF EXISTS "Creators can view their own import_jobs" ON public.import_jobs;
CREATE POLICY "Creators can view their own import_jobs"
  ON public.import_jobs
  FOR SELECT
  USING (created_by IS NOT DISTINCT FROM auth.uid());

-- Creators can see their job items (via job_id)
DROP POLICY IF EXISTS "Creators can view their import_job_items" ON public.import_job_items;
CREATE POLICY "Creators can view their import_job_items"
  ON public.import_job_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.import_jobs j
      WHERE j.id = import_job_items.job_id
        AND j.created_by IS NOT DISTINCT FROM auth.uid()
    )
  );
