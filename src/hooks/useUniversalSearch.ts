import { useQuery } from "@tanstack/react-query";
import { universalSearch, SearchResult } from "@/integrations/supabase/search";

export function useUniversalSearch(query: string, maxPerGroup: number = 5) {
  return useQuery<SearchResult[]>({
    queryKey: ["universal-search", query],
    queryFn: () => universalSearch(query, maxPerGroup),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}