-- Delete all lab bookings first (removes foreign key dependency)
DELETE FROM lab_bookings;

-- Delete all center staff relationships
DELETE FROM center_staff;

-- Delete geofence relationships
DELETE FROM geofence_lab_links;

-- Now delete all diagnostic centers
DELETE FROM diagnostic_centers;