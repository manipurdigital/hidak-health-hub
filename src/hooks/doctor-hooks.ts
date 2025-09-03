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

export const useAvailableSlots = (doctorId: string, availability: any[]) => {
  return useQuery({
    queryKey: ['available-slots', doctorId, availability?.length],
    queryFn: async () => {
      if (!doctorId || !availability || availability.length === 0) return [];

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Get booked time slots to exclude them
      const { data: bookedSlots, error: bookingError } = await supabase
        .from('consultations')
        .select('consultation_date, time_slot')
        .eq('doctor_id', doctorId)
        .neq('status', 'cancelled')
        .gte('consultation_date', todayStr);

      if (bookingError) throw bookingError;

      // Create a set of booked slots for quick lookup
      const bookedSet = new Set(
        (bookedSlots || []).map(slot => `${slot.consultation_date}|${slot.time_slot}`)
      );

      // Transform availability into discrete 30-minute slots
      const slots: any[] = [];
      
      availability.forEach(avail => {
        const availDate = avail.availability_date;
        
        // Only include dates >= today
        if (availDate < todayStr) return;

        // Parse start and end times
        const [startHour, startMin] = avail.start_time.split(':').map(Number);
        const [endHour, endMin] = avail.end_time.split(':').map(Number);

        // Create 30-minute slots between start and end time
        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
          // Format time as 12-hour format
          const timeStr = formatTo12Hour(currentHour, currentMin);
          const slotKey = `${availDate}|${timeStr}`;

          // Only add if not already booked
          if (!bookedSet.has(slotKey)) {
            // Create datetime for sorting
            const datetime = new Date(`${availDate}T${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}:00`);
            
            slots.push({
              date: availDate,
              time: timeStr,
              datetime: datetime.toISOString(),
              availability_id: avail.id
            });
          }

          // Increment by 30 minutes
          currentMin += 30;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour += 1;
          }
        }
      });

      // Sort by date and time
      return slots.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    },
    enabled: !!doctorId && Array.isArray(availability),
  });
};

// Helper function to format time to 12-hour format
function formatTo12Hour(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}