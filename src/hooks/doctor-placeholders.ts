import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Real implementations for doctor hooks

export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useBookedSlots = (doctorId: string) => {
  return useQuery({
    queryKey: ['booked-slots', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('consultations')
        .select('consultation_date, time_slot')
        .eq('doctor_id', doctorId)
        .neq('status', 'cancelled')
        .order('consultation_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId,
  });
};

export const useSendConsultationMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: any) => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-messages'] });
    },
  });
};