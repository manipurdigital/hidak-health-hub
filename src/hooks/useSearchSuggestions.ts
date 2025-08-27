import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SearchResult } from "@/integrations/supabase/search";

export interface SearchSuggestionGroup {
  type: 'medicine' | 'doctor' | 'lab_test';
  title: string;
  items: SearchResult[];
  viewAllUrl: string;
}

export interface TrendingMedicine {
  id: string;
  name: string;
  price: number;
  thumbnail_url: string | null;
}

// Local storage for recent searches
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 10;

// Simple in-memory LRU cache
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const CACHE_MAX_ENTRIES = 50;
const localCache = new Map<string, { data: SearchResult[]; ts: number }>();

// Helper function to filter out invalid medicines from search results
async function filterValidMedicines(results: SearchResult[]): Promise<SearchResult[]> {
  if (!results.length) return results;
  
  const medicineResults = results.filter(r => r.type === 'medicine');
  const nonMedicineResults = results.filter(r => r.type !== 'medicine');
  
  if (!medicineResults.length) return results;
  
  // Check which medicines still exist and are active
  const medicineIds = medicineResults.map(r => r.id);
  const { data: validMedicines } = await supabase
    .from('medicines')
    .select('id')
    .in('id', medicineIds)
    .eq('is_active', true);
    
  const validMedicineIds = new Set((validMedicines || []).map(m => m.id));
  
  // Filter out medicines that don't exist or are inactive
  const validMedicineResults = medicineResults.filter(r => validMedicineIds.has(r.id));
  
  return [...validMedicineResults, ...nonMedicineResults];
}

function getFromCache(key: string): SearchResult[] | null {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    localCache.delete(key);
    return null;
  }
  // refresh LRU
  localCache.delete(key);
  localCache.set(key, entry);
  return entry.data;
}

function setInCache(key: string, data: SearchResult[]) {
  if (localCache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = localCache.keys().next().value as string | undefined;
    if (firstKey) localCache.delete(firstKey);
  }
  localCache.set(key, { data, ts: Date.now() });
}

export function useSearchSuggestions(query: string, maxPerGroup: number = 5) {
  return useQuery<SearchResult[]>({
    queryKey: ["search-suggestions", query, maxPerGroup],
    queryFn: async ({ signal }) => {
      const cacheKey = `${query}|${maxPerGroup}`;
      const cached = getFromCache(cacheKey);
      if (cached) return cached;

      try {
        // Try universal_search_v2 first
        const v2 = await supabase.rpc("universal_search_v2", {
          q: query,
          max_per_group: maxPerGroup,
        }).abortSignal(signal as AbortSignal);

        if (!v2.error && Array.isArray(v2.data)) {
          const results = await filterValidMedicines((v2.data || []) as SearchResult[]);
          setInCache(cacheKey, results);
          return results;
        }

        // Fallback to universal_search
        const v1 = await supabase.rpc("universal_search", {
          q: query,
          max_per_group: maxPerGroup,
        }).abortSignal(signal as AbortSignal);

        if (!v1.error && Array.isArray(v1.data)) {
          const results = await filterValidMedicines((v1.data || []) as SearchResult[]);
          setInCache(cacheKey, results);
          return results;
        }

        // Final fallback: direct medicines query
        const tbl = await supabase
          .from('medicines')
          .select('id, name, price, image_url, thumbnail_url, manufacturer, brand')
          .or(`name.ilike.%${query}%,brand.ilike.%${query}%,manufacturer.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(maxPerGroup)
          .abortSignal(signal as AbortSignal);

        if (tbl.error) {
          console.warn('Search fallbacks failed:', v2.error || v1.error || tbl.error);
          return [] as SearchResult[];
        }

        const mapped = (tbl.data || []).map((med: any) => ({
          type: 'medicine' as const,
          id: med.id,
          title: med.name,
          subtitle: med.brand || med.manufacturer,
          thumbnail_url: med.thumbnail_url || med.image_url,
          price: med.price,
          href: `/medicine/${med.id}`,
        }));

        setInCache(cacheKey, mapped);
        
        // Track search suggestions view
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'view_suggestions', {
            event_category: 'search',
            search_term: query,
            results_count: mapped.length
          });
        }

        return mapped as SearchResult[];
      } catch (err) {
        console.warn('Search suggestions failed:', err);
        return [] as SearchResult[];
      }

    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTrendingMedicines(limit: number = 8) {
  return useQuery<TrendingMedicine[]>({
    queryKey: ['trending-medicines', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('recommend_medicines_for_time', {
        at_ts: new Date().toISOString(),
        in_city: null,
        in_pincode: null,
        top_n: limit
      });

      if (error) {
        console.error('Error fetching trending medicines:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        thumbnail_url: item.image_url
      }));
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useGroupedSuggestions(results: SearchResult[] = [], maxPerGroup: number = 5): SearchSuggestionGroup[] {
  return useMemo(() => {
    const groups: SearchSuggestionGroup[] = [];
    
    // Group medicines (excluding alternatives)
    const medicines = results.filter(r => r.type === "medicine" && !r.is_alternative).slice(0, maxPerGroup);
    if (medicines.length > 0) {
      groups.push({
        type: 'medicine',
        title: 'Medicines',
        items: medicines,
        viewAllUrl: '/medicines'
      });
    }

    // Group lab tests
    const labTests = results.filter(r => r.type === "lab_test").slice(0, maxPerGroup);
    if (labTests.length > 0) {
      groups.push({
        type: 'lab_test',
        title: 'Lab Tests',
        items: labTests,
        viewAllUrl: '/lab-tests'
      });
    }

    // Group doctors
    const doctors = results.filter(r => r.type === "doctor").slice(0, maxPerGroup);
    if (doctors.length > 0) {
      groups.push({
        type: 'doctor',
        title: 'Doctors',
        items: doctors,
        viewAllUrl: '/doctors'
      });
    }

    return groups;
  }, [results, maxPerGroup]);
}

// Recent searches utilities
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(q => q !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function trackSearchClick(result: SearchResult, query: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'click_result', {
      event_category: 'search',
      search_term: query,
      result_type: result.type,
      result_id: result.id,
      result_title: result.title
    });
  }
}