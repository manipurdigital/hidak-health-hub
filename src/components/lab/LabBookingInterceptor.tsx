import React, { useEffect } from 'react';
import { useNotifyAdminWhatsApp, useUpdateServiceArea } from '@/hooks/manual-assignment-hooks';

interface LabBookingInterceptorProps {
  bookingId: string;
  lat?: number;
  lng?: number;
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
  onComplete 
}: LabBookingInterceptorProps) {
  const notifyAdmin = useNotifyAdminWhatsApp();
  const updateServiceArea = useUpdateServiceArea();

  useEffect(() => {
    const processNewLabBooking = async () => {
      try {
        // If we have coordinates, validate service area
        if (lat && lng) {
          await updateServiceArea.mutateAsync({
            entityId: bookingId,
            entityType: 'lab_booking',
            isWithinServiceArea: true, // Will be validated by the backend
            lat,
            lng
          });
        }

        // Notify admin via WhatsApp
        await notifyAdmin.mutateAsync({
          type: 'new_lab_booking',
          entityId: bookingId
        });

        onComplete?.();
      } catch (error) {
        console.error('Error processing new lab booking:', error);
        onComplete?.();
      }
    };

    if (bookingId) {
      processNewLabBooking();
    }
  }, [bookingId, lat, lng]);

  return null; // This component doesn't render anything visible
}