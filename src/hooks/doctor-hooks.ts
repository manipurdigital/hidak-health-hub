import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Doctor-related hooks
export const useDoctor = (id: string) => {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useDoctorConsultations = (doctorId: string) => {
  return useQuery({
    queryKey: ['doctor-consultations', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId,
  });
};

export const useUpdateConsultationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-consultations'] });
      queryClient.invalidateQueries({ queryKey: ['consultation'] });
    },
  });
};

export const useConsultation = (id: string) => {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useConsultationMessages = (consultationId: string) => {
  return useQuery({
    queryKey: ['consultation-messages', consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!consultationId,
  });
};

export const useSendMessage = () => {
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

export const useDoctorAvailability = (doctorId: string) => {
  return useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_available', true)
        .eq('is_active', true)
        .order('availability_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId,
  });
};

export const useAvailableSlots = (doctorId: string, date: string) => {
  return useQuery({
    queryKey: ['available-slots', doctorId, date],
    queryFn: async () => {
      if (!doctorId || !date) return [];

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('availability_date', date)
        .eq('is_available', true)
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Transform the data into time slots
      return (data || []).map(slot => ({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available
      }));
    },
    enabled: !!doctorId && !!date,
  });
};