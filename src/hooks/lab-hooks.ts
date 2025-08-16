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

// Lab booking by ID
export const useLabBooking = (id: string) => {
  return useQuery({
    queryKey: ['lab-booking', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          test:lab_tests(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};