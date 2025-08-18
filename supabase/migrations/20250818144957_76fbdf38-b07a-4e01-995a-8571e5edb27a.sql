-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to warm cache every hour
-- This runs the warm-demand-cache edge function every hour at minute 0
SELECT cron.schedule(
  'warm-demand-cache',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://qaqmlmshpifwdnrvfkao.supabase.co/functions/v1/warm-demand-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcW1sbXNocGlmd2RucnZma2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzcwNzMsImV4cCI6MjA3MDkxMzA3M30.xXwG-vNJ_XMMv8kgfMx5rrZiG-9zX4H7rRNogjD-ugI"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Optional: Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION public.trigger_cache_warming()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    net.http_post(
        url:='https://qaqmlmshpifwdnrvfkao.supabase.co/functions/v1/warm-demand-cache',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhcW1sbXNocGlmd2RucnZqa2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzcwNzMsImV4cCI6MjA3MDkxMzA3M30.xXwG-vNJ_XMMv8kgfMx5rrZiG-9zX4H7rRNogjD-ugI"}'::jsonb,
        body:='{"trigger": "manual"}'::jsonb
    )::TEXT;
$$;

GRANT EXECUTE ON FUNCTION public.trigger_cache_warming() TO anon, authenticated;