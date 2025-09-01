import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Placeholder implementations for medicine hooks

export const useUserAddresses = () => {
  return useQuery({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (address: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id,
        name: address.name,
        phone: address.phone || null,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || null,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        type: address.type || 'home',
        landmark: address.landmark || null,
        latitude: address.latitude || null,
        longitude: address.longitude || null,
        is_default: !!address.is_default,
        country: address.country || 'India',
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const update = {
        name: data.name,
        phone: data.phone || null,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2 || null,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        type: data.type || 'home',
        landmark: data.landmark || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        is_default: !!data.is_default,
      };
      const { data: row, error } = await supabase
        .from('addresses')
        .update(update)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
    },
  });
};