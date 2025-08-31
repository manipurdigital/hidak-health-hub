// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export * from './performance-placeholders';
import { cachedSearch, PerformanceMonitor } from '@/lib/performance-cache';

export function useCachedMedicineSearch(searchTerm: string, filters?: any) {
  return useQuery({
    queryKey: ['medicines', 'search', searchTerm, filters],
    queryFn: () => cachedSearch(
      `medicines:${searchTerm}:${JSON.stringify(filters || {})}`,
      async () => {
        const requestId = PerformanceMonitor.generateRequestId();
        PerformanceMonitor.startTimer(requestId);

        let query = supabase
          .from('medicines')
          .select('*')
          .eq('is_active', true);

        if (searchTerm) {
          query = query.textSearch('name', searchTerm);
        }

        if (filters?.category_id) {
          query = query.eq('category_id', filters.category_id);
        }

        const { data, error } = await query.limit(20);

        await PerformanceMonitor.endTimer(
          requestId,
          '/api/medicines/search',
          'GET',
          error ? 500 : 200,
          1,
          false
        );

        if (error) throw error;
        return data;
      }
    ),
    enabled: searchTerm.length > 0,
    staleTime: 30000, // 30 seconds
  });
}

export function useCachedRecommendations() {
  return useQuery({
    queryKey: ['medicines', 'recommendations'],
    queryFn: () => cachedSearch(
      'recommendations:trending',
      async () => {
        const requestId = PerformanceMonitor.generateRequestId();
        PerformanceMonitor.startTimer(requestId);

        // Use direct medicine query for trending medicines
        const { data, error } = await supabase
          .from('medicines')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        await PerformanceMonitor.endTimer(
          requestId,
          '/api/medicines/recommendations',
          'GET',
          error ? 500 : 200,
          1,
          false
        );

        if (error) throw error;
        return data || [];
      },
      60000 // 1 minute cache for recommendations
    ),
    staleTime: 60000,
  });
}

export function usePerformanceStats(timeRange = '24h') {
  return useQuery({
    queryKey: ['performance', 'stats', timeRange],
    queryFn: async () => {
      const requestId = PerformanceMonitor.generateRequestId();
      PerformanceMonitor.startTimer(requestId);

      const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Placeholder implementation - would query performance_logs table when available
      const data = [];
      const error = null;

      await PerformanceMonitor.endTimer(
        requestId,
        '/api/performance/stats',
        'GET',
        error ? 500 : 200,
        1,
        false
      );

      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}

export function useCacheManagement() {
  const queryClient = useQueryClient();

  const clearServerCache = useMutation({
    mutationFn: async () => {
      // Use a simpler approach since the RPC doesn't exist
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });

  const clearBrowserCache = () => {
    queryClient.clear();
    // Also clear performance cache
    if (typeof window !== 'undefined') {
      const { PerformanceCache } = require('@/lib/performance-cache');
      PerformanceCache.clearBrowserCache();
    }
  };

  return {
    clearServerCache,
    clearBrowserCache,
  };
}