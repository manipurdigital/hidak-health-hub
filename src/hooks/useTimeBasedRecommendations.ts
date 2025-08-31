// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { recommendMedicinesForTime, RecParams, RecItem } from '@/integrations/supabase/recommend';

export interface TimeBasedRecommendationsContext {
  at?: Date;
  city?: string;
  pincode?: string;
  limit?: number;
}

export function useTimeBasedRecommendations(ctx: TimeBasedRecommendationsContext = {}) {
  const {
    at = new Date(),
    city,
    pincode,
    limit = 10
  } = ctx;

  return useQuery({
    queryKey: ['time-based-recommendations', at.toISOString(), city, pincode, limit],
    queryFn: (): Promise<RecItem[]> => recommendMedicinesForTime({
      at,
      city,
      pincode,
      limit
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}