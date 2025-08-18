import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SimilarMedicine {
  id: string;
  name: string;
  price: number;
  thumbnail_url: string | null;
}

export const useSimilarMedicines = (
  medicineId: string | null, 
  mode: 'exact' | 'family' = 'exact'
) => {
  return useQuery<SimilarMedicine[]>({
    queryKey: ['similar-medicines', medicineId, mode],
    queryFn: async () => {
      if (!medicineId) {
        return [];
      }

      const { data, error } = await supabase.rpc('similar_medicines', {
        ref_medicine_id: medicineId,
        mode: mode
      });

      if (error) {
        console.error('Similar medicines error:', error);
        throw new Error(`Failed to find similar medicines: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!medicineId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};