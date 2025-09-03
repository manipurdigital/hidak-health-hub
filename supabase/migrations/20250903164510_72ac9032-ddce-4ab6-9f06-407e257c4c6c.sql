-- Update doctor_availability table to use specific dates instead of day_of_week
ALTER TABLE doctor_availability 
DROP COLUMN day_of_week,
ADD COLUMN availability_date date NOT NULL DEFAULT CURRENT_DATE;

-- Add index for better performance on date queries
CREATE INDEX idx_doctor_availability_date ON doctor_availability(doctor_id, availability_date);

-- Update the unique constraint to prevent duplicate slots on same date/time
ALTER TABLE doctor_availability 
ADD CONSTRAINT unique_doctor_date_time UNIQUE (doctor_id, availability_date, start_time, end_time);