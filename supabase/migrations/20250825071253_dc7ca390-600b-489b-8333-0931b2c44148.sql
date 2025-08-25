-- Add lat/lng columns to stores table if they don't exist
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Add lat/lng columns to diagnostic_centers table if they don't exist  
ALTER TABLE diagnostic_centers 
ADD COLUMN IF NOT EXISTS code TEXT;