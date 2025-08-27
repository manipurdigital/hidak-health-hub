-- Clear all existing sample data to start fresh with actual data

-- Delete dependent records first to avoid foreign key violations
DELETE FROM consultation_messages;
DELETE FROM consultations;
DELETE FROM doctor_availability;
DELETE FROM lab_bookings;
DELETE FROM lab_reports;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM carts;
DELETE FROM center_staff;

-- Delete main entity records
DELETE FROM doctors;
DELETE FROM medicines;
DELETE FROM lab_tests;
DELETE FROM diagnostic_centers;

-- Reset any sequences or counters if needed
-- Note: UUIDs don't need sequence resets