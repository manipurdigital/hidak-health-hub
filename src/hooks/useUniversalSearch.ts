import { useQuery } from "@tanstack/react-query";
import { SearchResult } from "@/integrations/supabase/search";
import { supabase } from "@/integrations/supabase/client";
import { isFeatureEnabled } from "@/lib/feature-flags";

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

      // Enhance medicine results with composition data and filter out inactive/deleted medicines
      const enhancedResults = await Promise.all(
        (data || []).map(async (result: any) => {
          if (result.type === 'medicine') {
            // Get additional composition data from medicines table and verify medicine exists
            const { data: medicineData } = await supabase
              .from('medicines')
              .select('composition_key, composition_family_key, name, generic_name')
              .eq('id', result.id)
              .eq('is_active', true)
              .maybeSingle();
            
            if (medicineData) {
              return {
                ...result,
                composition_key: medicineData.composition_key,
                composition_family_key: medicineData.composition_family_key,
                rank_score: 1.0 // Default score since v2 doesn't return it directly
              };
            }
            // Return null for inactive/deleted medicines to filter them out
            return null;
          }
          return result;
        })
      );

      // Filter out null results (inactive/deleted medicines)
      const validResults = enhancedResults.filter(result => result !== null);

      // Filter out results based on feature flags
      const filteredResults = validResults.filter(result => {
        if (result.type === "doctor") {
          return isFeatureEnabled("ENABLE_CONSULTATIONS");
        }
        // Filter wellness-related content if it exists in search results
        if (result.href?.includes('/wellness') || result.title?.toLowerCase().includes('wellness')) {
          return isFeatureEnabled("ENABLE_WELLNESS");
        }
        return true;
      });

      return filteredResults as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}