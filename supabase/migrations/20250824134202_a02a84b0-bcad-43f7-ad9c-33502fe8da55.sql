-- Fix RLS policies for partner applications to allow public submissions

-- Drop existing restrictive policies and create permissive ones for submissions
DROP POLICY IF EXISTS "Public can submit lab applications" ON public.lab_applications;
DROP POLICY IF EXISTS "Public can submit delivery applications" ON public.delivery_partner_applications;  
DROP POLICY IF EXISTS "Public can submit pharmacy applications" ON public.pharmacy_applications;

-- Allow anyone to submit applications (this is needed for public signup)
CREATE POLICY "Anyone can submit lab applications" 
ON public.lab_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can submit delivery applications" 
ON public.delivery_partner_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can submit pharmacy applications" 
ON public.pharmacy_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);