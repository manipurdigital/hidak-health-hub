import React, { useEffect } from 'react';
import { useNotifyAdminWhatsApp, useUpdateServiceArea } from '@/hooks/manual-assignment-hooks';

interface OrderCreationInterceptorProps {
  orderId: string;
  lat?: number;
  lng?: number;
  onComplete?: () => void;
}

/**
 * Component that automatically validates service area and notifies admin
 * when a new order is created
 */
export function OrderCreationInterceptor({ 
  orderId, 
  lat, 
  lng, 
  onComplete 
}: OrderCreationInterceptorProps) {
  const notifyAdmin = useNotifyAdminWhatsApp();
  const updateServiceArea = useUpdateServiceArea();

  useEffect(() => {
    const processNewOrder = async () => {
      try {
        // If we have coordinates, validate service area
        if (lat && lng) {
          await updateServiceArea.mutateAsync({
            entityId: orderId,
            entityType: 'order',
            isWithinServiceArea: true, // Will be validated by the backend
            lat,
            lng
          });
        }

        // Notify admin via WhatsApp
        await notifyAdmin.mutateAsync({
          type: 'new_order',
          entityId: orderId
        });

        onComplete?.();
      } catch (error) {
        console.error('Error processing new order:', error);
        onComplete?.();
      }
    };

    if (orderId) {
      processNewOrder();
    }
  }, [orderId, lat, lng]);

  return null; // This component doesn't render anything visible
}