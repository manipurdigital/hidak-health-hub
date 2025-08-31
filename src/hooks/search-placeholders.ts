// Placeholder implementations for search hooks
import { useQuery } from '@tanstack/react-query';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price?: number;
  image?: string;
}

export interface SimilarMedicine {
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  manufacturer: string;
  similarity_score: number;
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

export const useUniversalSearch = (query: string) => {
  return useQuery({
    queryKey: ['universal-search', query],
    queryFn: async (): Promise<SearchResult[]> => {
      return [];
    },
    enabled: query.length > 0,
  });
};

export const useSimilarMedicines = (medicineId: string) => {
  return useQuery({
    queryKey: ['similar-medicines', medicineId],
    queryFn: async (): Promise<SimilarMedicine[]> => {
      return [];
    },
    enabled: !!medicineId,
  });
};

export const useDemandRecommendations = () => {
  return useQuery({
    queryKey: ['demand-recommendations'],
    queryFn: async (): Promise<TrendingMedicine[]> => {
      return [];
    },
  });
};