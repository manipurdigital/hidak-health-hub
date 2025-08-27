import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UpcomingConsultation {
  id: string;
  patient_id: string;
  consultation_date: string;
  time_slot: string;
  status: string;
  consultation_type: string;
  patient_notes: string;
  doctor_notes: string;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
  follow_up_expires_at: string | null;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export const useDoctorUpcomingConsultations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['doctor-upcoming-consultations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get doctor info
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) throw doctorError;
      if (!doctorInfo) return [];

      // Get all consultations with status priority ordering
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          profiles!consultations_patient_id_fkey(full_name, phone, email)
        `)
        .eq('doctor_id', doctorInfo.id)
        .not('status', 'eq', 'cancelled')
        .order('consultation_date')
        .order('time_slot');

      if (error) throw error;

      // Sort by priority: in_progress > scheduled > pending > completed
      const statusPriority = {
        'in_progress': 1,
        'scheduled': 2, 
        'pending': 3,
        'rescheduled': 4,
        'completed': 5
      };

      const sortedData = data.sort((a, b) => {
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 6;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 6;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort by date and time
        const dateCompare = new Date(a.consultation_date).getTime() - new Date(b.consultation_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        return a.time_slot.localeCompare(b.time_slot);
      });

      return sortedData.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as unknown as UpcomingConsultation[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Cache for 10 seconds to reduce repeated calls
  });
};

export const useDoctorInfo = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['doctor-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since doctor info rarely changes
  });
};