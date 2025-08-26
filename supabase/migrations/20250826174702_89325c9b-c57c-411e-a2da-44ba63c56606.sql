-- Add base_km column to delivery_base_locations table
ALTER TABLE public.delivery_base_locations 
ADD COLUMN base_km numeric NOT NULL DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.delivery_base_locations.base_km IS 'Distance in kilometers covered by the base fare before per-km charges apply';