import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Doctor-related hooks
export const useDoctor = (id: string) => {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      // Placeholder implementation
      return {
        id,
        name: 'Dr. Sample',
        specialization: 'General Medicine',
        experience_years: 5,
        consultation_fee: 500,
        is_available: true,
        rating: 4.5,
        review_count: 100,
        languages: ['English'],
        hospital_affiliation: 'Sample Hospital',
        bio: 'Sample doctor bio',
        qualification: 'MBBS',
        profile_image_url: null,
        is_verified: true
      };
    },
  });
};

export const useDoctorConsultations = (doctorId: string) => {
  return useQuery({
    queryKey: ['doctor-consultations', doctorId],
    queryFn: async () => {
      return [];
    },
  });
};

export const useUpdateConsultationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Placeholder implementation
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-consultations'] });
    },
  });
};

export const useConsultation = (id: string) => {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      return {
        id,
        patient_name: 'Sample Patient',
        status: 'active',
        created_at: new Date().toISOString(),
        notes: ''
      };
    },
  });
};

export const useConsultationMessages = (consultationId: string) => {
  return useQuery({
    queryKey: ['consultation-messages', consultationId],
    queryFn: async () => {
      return [];
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: any) => {
      return message;
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
      return [];
    },
  });
};

export const useAvailableSlots = (doctorId: string, date: string) => {
  return useQuery({
    queryKey: ['available-slots', doctorId, date],
    queryFn: async () => {
      return [];
    },
  });
};