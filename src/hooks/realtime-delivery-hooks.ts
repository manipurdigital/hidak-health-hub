import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealTimeDeliveryUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('delivery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments'
        },
        (payload) => {
          console.log('Delivery assignment updated:', payload);
          
          // Invalidate related queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['admin-delivery-assignments'] });
          queryClient.invalidateQueries({ queryKey: ['my-rider-jobs'] });
          queryClient.invalidateQueries({ queryKey: ['order-delivery-tracking'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Hook to enable real-time updates for a specific order
export function useRealTimeOrderTracking(orderId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('Order delivery status updated:', payload);
          
          // Invalidate specific order tracking query
          queryClient.invalidateQueries({ 
            queryKey: ['order-delivery-tracking', orderId] 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);
}