import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Single doctor by ID
export const useDoctor = (id: string) => {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .eq('is_available', true)
        .eq('is_verified', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Doctor availability
export const useDoctorAvailability = (doctorId: string) => {
  return useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true)
        .order('day_of_week');
      
      if (error) throw error;
      return data;
    },
    enabled: !!doctorId,
  });
};

// Generate available slots for next 5 days
export const useAvailableSlots = (doctorId: string, availability: any[]) => {
  return useQuery({
    queryKey: ['available-slots', doctorId, availability],
    queryFn: async () => {
      if (!availability.length) return [];

      const slots: Array<{
        date: string;
        time: string;
        datetime: string;
        dayOfWeek: number;
      }> = [];

      const today = new Date();
      
      // Generate next 5 days
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Find doctor's availability for this day
        const dayAvailability = availability.find(av => av.day_of_week === dayOfWeek);
        
        if (dayAvailability) {
          // Generate 30-minute slots between start and end time
          const startTime = new Date(`2000-01-01T${dayAvailability.start_time}`);
          const endTime = new Date(`2000-01-01T${dayAvailability.end_time}`);
          
          let currentTime = new Date(startTime);
          
          while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().slice(0, 5);
            const datetime = `${date.toISOString().split('T')[0]}T${timeString}:00`;
            
            // Check if slot is not in the past
            const slotDateTime = new Date(datetime);
            if (slotDateTime > new Date()) {
              slots.push({
                date: date.toISOString().split('T')[0],
                time: timeString,
                datetime: datetime,
                dayOfWeek: dayOfWeek,
              });
            }
            
            // Add 30 minutes
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        }
      }

      // TODO: Filter out already booked slots from consultations table
      
      return slots;
    },
    enabled: !!doctorId && availability.length > 0,
  });
};

// Single consultation by ID
export const useConsultation = (id: string) => {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

// Consultation messages
export const useConsultationMessages = (consultationId: string) => {
  return useQuery({
    queryKey: ['consultation-messages', consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('sent_at');
      
      if (error) throw error;
      return data;
    },
    enabled: !!consultationId,
  });
};

// Send consultation message
export const useSendMessage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ consultationId, content, senderType }: {
      consultationId: string;
      content: string;
      senderType: 'patient' | 'doctor';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('consultation_messages')
        .insert({
          consultation_id: consultationId,
          sender_id: user.id,
          sender_type: senderType,
          content: content,
          message_type: 'text',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['consultation-messages', variables.consultationId] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};