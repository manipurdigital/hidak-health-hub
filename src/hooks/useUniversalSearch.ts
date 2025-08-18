import { useQuery } from "@tanstack/react-query";
import { SearchResult } from "@/integrations/supabase/search";
import { supabase } from "@/integrations/supabase/client";

export function useUniversalSearch(query: string, maxPerGroup: number = 5) {
  return useQuery<SearchResult[]>({
    queryKey: ["universal-search", query, maxPerGroup],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("universal_search_v2", {
        q: query,
        max_per_group: maxPerGroup,
      });

      if (error) {
        console.error("Search error:", error);
        throw new Error(error.message);
      }

      // Enhance medicine results with composition data
      const enhancedResults = await Promise.all(
        (data || []).map(async (result: any) => {
          if (result.type === 'medicine') {
            // Get additional composition data from medicines table
            const { data: medicineData } = await supabase
              .from('medicines')
              .select('composition_key, composition_family_key, name, generic_name')
              .eq('id', result.id)
              .single();
            
            if (medicineData) {
              return {
                ...result,
                composition_key: medicineData.composition_key,
                composition_family_key: medicineData.composition_family_key,
                rank_score: 1.0 // Default score since v2 doesn't return it directly
              };
            }
          }
          return result;
        })
      );

      return enhancedResults as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}