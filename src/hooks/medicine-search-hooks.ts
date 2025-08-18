import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MedicineSearchResult {
  id: string;
  name: string;
  generic_name: string | null;
  composition_text: string | null;
  composition_key: string | null;
  composition_family_key: string | null;
  thumbnail_url: string | null;
  price: number;
  rank_score: number;
}

export interface SimilarMedicine {
  id: string;
  name: string;
  price: number;
  thumbnail_url: string | null;
}

// Hook for brand/composition search with ranking
export const useMedicineSearch = (query: string, maxRows: number = 20) => {
  return useQuery<MedicineSearchResult[]>({
    queryKey: ['medicine-search', query, maxRows],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const { data, error } = await supabase.rpc('search_medicines_brand_or_composition', {
        q: query.trim(),
        max_rows: maxRows
      });

      if (error) {
        console.error('Medicine search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!query && query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for finding similar medicines by composition
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

// Combined hook for search with alternatives
export const useMedicineSearchWithAlternatives = (query: string, maxResults: number = 10) => {
  const searchResults = useMedicineSearch(query, maxResults);
  
  // Get alternatives for the first search result
  const firstResultId = searchResults.data?.[0]?.id || null;
  const alternatives = useSimilarMedicines(firstResultId, 'family');

  return {
    mainResults: searchResults.data || [],
    alternatives: alternatives.data || [],
    isLoading: searchResults.isLoading || alternatives.isLoading,
    error: searchResults.error || alternatives.error,
    refetch: () => {
      searchResults.refetch();
      alternatives.refetch();
    }
  };
};