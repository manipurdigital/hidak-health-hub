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

      // Get upcoming consultations (next 7 days, any status except completed/cancelled)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          profiles!consultations_patient_id_fkey(full_name, phone, email)
        `)
        .eq('doctor_id', doctorInfo.id)
        .gte('consultation_date', today.toISOString().split('T')[0])
        .lte('consultation_date', nextWeek.toISOString().split('T')[0])
        .not('status', 'in', '(completed,cancelled)')
        .order('consultation_date')
        .order('time_slot');

      if (error) throw error;

      return data.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as unknown as UpcomingConsultation[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
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
  });
};