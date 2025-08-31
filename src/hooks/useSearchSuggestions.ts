import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price?: number;
  image?: string;
  thumbnail_url?: string;
  href?: string;
  is_alternative?: boolean;
  composition_match_type?: string;
}

export interface SearchSuggestionGroup {
  title: string;
  items: SearchResult[];
}

export interface TrendingMedicine {
  medicine_id: string;
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  manufacturer: string;
  expected_qty: number;
  score: number;
}

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query.trim()) {
        return [];
      }
      
      const { data, error } = await supabase.rpc('universal_search', {
        query_text: query,
        limit_count: 20
      });
      
      if (error) {
        console.error('Search error:', error);
        return [];
      }
      
      return Array.isArray(data) ? data.map((item: any) => ({
        type: item.type || 'medicine',
        id: item.id,
        title: item.title || item.name,
        subtitle: item.subtitle || '',
        category: item.type || 'medicine',
        price: item.price,
        thumbnail_url: item.thumbnail_url,
        href: item.href,
        is_alternative: item.is_alternative || false,
        composition_match_type: item.composition_match_type
      })) : [];
    },
    enabled: query.length > 0,
  });
};

export const useGroupedSuggestions = (results: SearchResult[], maxPerGroup: number = 5) => {
  const grouped = React.useMemo(() => {
    if (!Array.isArray(results)) return [];
    
    const groups: Record<string, SearchResult[]> = {};
    
    results.forEach(result => {
      const type = result.type || 'medicine';
      if (!groups[type]) {
        groups[type] = [];
      }
      if (groups[type].length < maxPerGroup) {
        groups[type].push(result);
      }
    });
    
    return Object.entries(groups).map(([type, items]) => ({
      title: type.charAt(0).toUpperCase() + type.slice(1) + 's',
      items,
      type
    }));
  }, [results, maxPerGroup]);
  
  return grouped;
};

export const useTrendingMedicines = (limit: number = 8) => {
  return useQuery({
    queryKey: ['trending-medicines', limit],
    queryFn: async (): Promise<TrendingMedicine[]> => {
      const { data, error } = await supabase.rpc('recommend_medicines_for_time', {
        at_ts: new Date().toISOString(),
        top_n: limit
      });
      
      if (error) {
        console.error('Trending medicines error:', error);
        return [];
      }
      
      return Array.isArray(data) ? data.map((item: any) => ({
        medicine_id: item.id,
        id: item.id,
        name: item.name,
        price: item.price,
        discount_price: item.discount_price,
        image_url: item.image_url,
        manufacturer: item.manufacturer,
        expected_qty: 1,
        score: item.score || 1
      })) : [];
    },
  });
};

export const addRecentSearch = (query: string) => {
  // Placeholder implementation
};

export const trackSearchClick = (result: SearchResult, query?: string) => {
  // Placeholder implementation
};

export const getRecentSearches = (): string[] => {
  // Placeholder implementation
  return [];
};

export const useUniversalSearch = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: ['universal-search', query, limit],
    queryFn: async (): Promise<SearchResult[]> => {
      return [];
    },
    enabled: query.length > 0,
  });
};