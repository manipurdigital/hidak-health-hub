-- Create public storage bucket for lab reports (idempotent)
insert into storage.buckets (id, name, public)
values ('lab-reports', 'lab-reports', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist first, then recreate
drop policy if exists "Public can read lab reports" on storage.objects;
drop policy if exists "Users can upload own lab reports" on storage.objects;
drop policy if exists "Users can update own lab reports" on storage.objects;
drop policy if exists "Users can delete own lab reports" on storage.objects;

-- Storage policies for lab-reports bucket
-- Allow public read (for viewing via public URL)
create policy "Public can read lab reports"
on storage.objects
for select
using (bucket_id = 'lab-reports');

-- Allow authenticated users to upload files into a folder named with their user ID
create policy "Users can upload own lab reports"
on storage.objects
for insert
with check (
  bucket_id = 'lab-reports'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own files
create policy "Users can update own lab reports"
on storage.objects
for update
using (
  bucket_id = 'lab-reports'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
create policy "Users can delete own lab reports"
on storage.objects
for delete
using (
  bucket_id = 'lab-reports'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Align lab_reports table with UI needs (idempotent column adds)
alter table public.lab_reports add column if not exists user_id uuid;
alter table public.lab_reports add column if not exists report_name text;
alter table public.lab_reports add column if not exists file_size integer;
alter table public.lab_reports add column if not exists file_type text;
alter table public.lab_reports add column if not exists uploaded_at timestamptz not null default now();

-- Drop existing policies on lab_reports table first, then recreate
drop policy if exists "Users can insert their lab reports" on public.lab_reports;
drop policy if exists "Users can update their lab reports" on public.lab_reports;
drop policy if exists "Users can delete their lab reports" on public.lab_reports;
drop policy if exists "Users view their uploaded lab reports" on public.lab_reports;

-- RLS policies for user-managed lab reports
create policy "Users can insert their lab reports"
on public.lab_reports
for insert
with check (auth.uid() = user_id);

create policy "Users can update their lab reports"
on public.lab_reports
for update
using (auth.uid() = user_id);

create policy "Users can delete their lab reports"
on public.lab_reports
for delete
using (auth.uid() = user_id);

create policy "Users view their uploaded lab reports"
on public.lab_reports
for select
using (auth.uid() = user_id);