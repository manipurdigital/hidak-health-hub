import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOrderDeliveryStatus(orderId: string) {
  return useQuery({
    queryKey: ['order-delivery-status', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            order_number,
            shipping_address,
            user_id
          ),
          riders(
            code,
            full_name
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!orderId,
  });
}