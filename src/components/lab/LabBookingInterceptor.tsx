
import React, { useEffect } from 'react';
import { useNotifyAdminWhatsApp, useUpdateServiceArea } from '@/hooks/manual-assignment-hooks';

interface LabBookingInterceptorProps {
  bookingId: string;
  lat?: number;
  lng?: number;
  pickupAddress?: any;
  onComplete?: () => void;
}

/**
 * Component that automatically validates service area and notifies admin
 * when a new lab booking is created
 */
export function LabBookingInterceptor({ 
  bookingId, 
  lat, 
  lng, 
  pickupAddress,
  onComplete 
}: LabBookingInterceptorProps) {
  const notifyAdmin = useNotifyAdminWhatsApp();
  const updateServiceArea = useUpdateServiceArea();

  useEffect(() => {
    const processNewLabBooking = async () => {
      try {
        console.log('Processing lab booking with location:', { 
          bookingId, 
          lat, 
          lng, 
          hasAddress: !!pickupAddress 
        });

        // If we have coordinates, validate service area
        if (lat && lng) {
          await updateServiceArea.mutateAsync({
            entityId: bookingId,
            entityType: 'lab_booking',
            isWithinServiceArea: true, // Will be validated by the backend
            lat,
            lng
          });
          console.log('Service area validation completed');
        }

        // Notify admin via WhatsApp with location data
        await notifyAdmin.mutateAsync({
          type: 'new_lab_booking',
          entityId: bookingId
        });
        console.log('Admin notification sent');

        onComplete?.();
      } catch (error) {
        console.error('Error processing new lab booking:', error);
        onComplete?.();
      }
    };

    if (bookingId) {
      processNewLabBooking();
    }
  }, [bookingId, lat, lng, pickupAddress]);

  return null; // This component doesn't render anything visible
}
