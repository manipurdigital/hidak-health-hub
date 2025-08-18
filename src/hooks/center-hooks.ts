import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Fetch bookings for center staff
export const useCenterBookings = () => {
  return useQuery({
    queryKey: ['center-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          test:lab_tests(name, price, category)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Update lab booking status and details
export const useUpdateLabBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      status?: string;
      collector_name?: string;
      eta?: string;
      collected_at?: string;
      reschedule_reason?: string;
      special_instructions?: string;
    }) => {
      const { id, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('lab_bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    },
  });
};