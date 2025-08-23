import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Single medicine by ID
export const useMedicine = (id: string) => {
  return useQuery({
    queryKey: ['medicine', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Addresses
export const useAddresses = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['addresses', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateAddress = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (addressData: any) => {
      if (!user?.id) {
        throw new Error('Please sign in to save an address.');
      }
      const payload = { ...addressData, user_id: user.id };
      const { data, error } = await supabase
        .from('addresses')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Success",
        description: "Address added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};