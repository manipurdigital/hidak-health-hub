import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export * from './search-placeholders';

export interface TrendingMedicine {
  medicine_id: string;
  name: string;
  image_url: string | null;
  price: number;
  score: number;
  expected_qty: number;
}

export interface DemandRecommendationParams {
  timestamp?: Date;
  city?: string;
  pincode?: string;
  limit?: number;
}

export function useDemandRecommendations({
  timestamp = new Date(),
  city,
  pincode,
  limit = 10
}: DemandRecommendationParams = {}) {
  return useQuery({
    queryKey: ['demand-recommendations', timestamp.toISOString(), city, pincode, limit],
    queryFn: async (): Promise<TrendingMedicine[]> => {
      const { data, error } = await supabase.rpc('recommend_medicines_for_time', {
        at_ts: timestamp.toISOString(),
        in_city: city || null,
        in_pincode: pincode || null,
        top_n: limit
      });

      if (error) {
        console.error('Error fetching demand recommendations:', error);
        throw error;
      }

      // Transform data to match TrendingMedicine interface
      return (data || []).map((item: any) => ({
        medicine_id: item.id,
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        price: item.price,
        score: item.score,
        expected_qty: 1,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}

// Hook for real-time trending medicines (current time)
export function useTrendingMedicines(city?: string, pincode?: string, limit?: number) {
  return useDemandRecommendations({
    timestamp: new Date(),
    city,
    pincode,
    limit
  });
}

// Hook for predictions at specific times
export function usePredictedDemand(
  targetTime: Date,
  city?: string,
  pincode?: string,
  limit?: number
) {
  return useDemandRecommendations({
    timestamp: targetTime,
    city,
    pincode,
    limit
  });
}