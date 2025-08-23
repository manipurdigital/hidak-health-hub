-- Drop the existing restrictive policies for INSERT operations
DROP POLICY IF EXISTS "Users can create their own applications" ON public.lab_applications;
DROP POLICY IF EXISTS "Users can create their own pharmacy applications" ON public.pharmacy_applications;
DROP POLICY IF EXISTS "Users can create their own delivery applications" ON public.delivery_partner_applications;

-- Allow public submissions for partner applications so unauthenticated users can apply
-- Lab applications
CREATE POLICY "Public can submit lab applications"
ON public.lab_applications
FOR INSERT
WITH CHECK (true);

-- Pharmacy applications
CREATE POLICY "Public can submit pharmacy applications"
ON public.pharmacy_applications
FOR INSERT
WITH CHECK (true);

-- Delivery partner applications
CREATE POLICY "Public can submit delivery applications"
ON public.delivery_partner_applications
FOR INSERT
WITH CHECK (true);