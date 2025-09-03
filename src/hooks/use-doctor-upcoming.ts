import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UpcomingConsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  consultation_time: string;
  time_slot: string;
  status: string;
  consultation_type?: string; // Optional field for compatibility
  consultation_fee: number;
  total_amount: number;
  payment_status: string;
  notes: string;
  patient_notes: string;
  created_at: string;
  paid_at: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

export const useDoctorUpcomingConsultations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['doctor-upcoming-consultations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching consultations for doctor user:', user.id);

      // First get doctor info
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor info:', doctorError);
        throw doctorError;
      }
      if (!doctorInfo) {
        console.log('No doctor found for user:', user.id);
        return [];
      }

      console.log('Found doctor:', doctorInfo.id);

      // Get all consultations
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('doctor_id', doctorInfo.id)
        .not('status', 'eq', 'cancelled')
        .order('consultation_date')
        .order('time_slot');

      if (error) {
        console.error('Error fetching consultations:', error);
        throw error;
      }

      console.log('Raw consultations data:', data);

      // Get patient profiles for each consultation
      const consultationsWithProfiles = await Promise.all(
        (data || []).map(async (consultation) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('user_id', consultation.patient_id)
            .single();
          
          let finalProfile = profile;
          
          if (profileError || !profile?.full_name) {
            console.warn('Could not fetch complete profile for patient:', consultation.patient_id, profileError);
            
            // Extract patient details from patient_notes if available
            if (consultation.patient_notes) {
              const extractPatientInfo = (notes: string) => {
                const patterns = {
                  name: /Patient:\s*([^,]+)/i,
                  phone: /Phone:\s*([^,]+)/i,
                  email: /Email:\s*([^,]+)/i
                };
                
                const nameMatch = notes.match(patterns.name);
                const phoneMatch = notes.match(patterns.phone);
                const emailMatch = notes.match(patterns.email);
                
                return {
                  full_name: nameMatch ? nameMatch[1].trim() : 'Unknown Patient',
                  phone: phoneMatch ? phoneMatch[1].trim() : '',
                  email: emailMatch ? emailMatch[1].trim() : ''
                };
              };
              
              finalProfile = extractPatientInfo(consultation.patient_notes);
            } else {
              finalProfile = null;
            }
          }
          
          return {
            ...consultation,
            profiles: finalProfile,
            consultation_type: consultation.consultation_type || 'video' // Use existing or default
          };
        })
      );

      // Sort by priority: in_progress > scheduled > pending > completed
      const statusPriority = {
        'in_progress': 1,
        'scheduled': 2, 
        'pending': 3,
        'rescheduled': 4,
        'completed': 5
      };

      const sortedData = consultationsWithProfiles.sort((a, b) => {
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 6;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 6;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // If same priority, sort by date and time
        const dateCompare = new Date(a.consultation_date).getTime() - new Date(b.consultation_date).getTime();
        if (dateCompare !== 0) return dateCompare;
        
        return a.time_slot?.localeCompare(b.time_slot || '') || 0;
      });

      const result = sortedData as unknown as UpcomingConsultation[];

      console.log('Processed consultations:', result);
      return result;
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
