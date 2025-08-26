-- Remove all mock doctors and related data
-- This will clean up the database for adding real doctors

-- First, delete consultation messages related to consultations with existing doctors
DELETE FROM consultation_messages 
WHERE consultation_id IN (
  SELECT id FROM consultations 
  WHERE doctor_id IN (SELECT id FROM doctors)
);

-- Delete consultations with existing doctors
DELETE FROM consultations 
WHERE doctor_id IN (SELECT id FROM doctors);

-- Delete doctor availability records
DELETE FROM doctor_availability 
WHERE doctor_id IN (SELECT id FROM doctors);

-- Finally, delete all doctors
DELETE FROM doctors;