-- Allow public submissions for partner applications so unauthenticated users can apply
-- Lab applications
CREATE POLICY IF NOT EXISTS "Public can submit lab applications"
ON public.lab_applications
FOR INSERT
WITH CHECK (true);

-- Pharmacy applications
CREATE POLICY IF NOT EXISTS "Public can submit pharmacy applications"
ON public.pharmacy_applications
FOR INSERT
WITH CHECK (true);

-- Delivery partner applications
CREATE POLICY IF NOT EXISTS "Public can submit delivery applications"
ON public.delivery_partner_applications
FOR INSERT
WITH CHECK (true);
