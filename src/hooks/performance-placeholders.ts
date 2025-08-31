// Placeholder implementations for performance hooks
import { useQuery } from '@tanstack/react-query';

export const usePerformanceMetrics = () => {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => ({
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      uptime: 100,
    }),
  });
};

export const usePerformanceLogs = () => {
  return useQuery({
    queryKey: ['performance-logs'],
    queryFn: async () => [],
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: async () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }),
  });
};