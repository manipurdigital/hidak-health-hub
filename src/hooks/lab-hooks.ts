import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Single lab test by ID
export const useLabTest = (id: string) => {
  return useQuery({
    queryKey: ['lab-test', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
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

// Lab booking by ID with test details
export const useLabBooking = (id: string) => {
  return useQuery({
    queryKey: ['lab-booking', id],
    queryFn: async () => {
      // First get the booking
      const { data: booking, error: bookingError } = await supabase
        .from('lab_bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (bookingError) throw bookingError;
      
      // Then get the test details
      const { data: test, error: testError } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('id', booking.test_id)
        .single();
      
      if (testError) throw testError;
      
      return { ...booking, test };
    },
    enabled: !!id,
  });
};