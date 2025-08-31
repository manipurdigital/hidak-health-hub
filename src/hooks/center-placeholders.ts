import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Placeholder implementations - replace with actual implementations when backend is ready

export const useCenterBookings = () => {
  return useQuery({
    queryKey: ['center-bookings'],
    queryFn: async () => [],
  });
};

export const useCenterMetrics = () => {
  return useQuery({
    queryKey: ['center-metrics'],
    queryFn: async () => ({
      total_orders: 0,
      revenue: 0,
      pending_orders: 0,
      completed_orders: 0
    }),
  });
};

export const useLinkCenterAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      // Placeholder implementation
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-bookings'] });
    },
  });
};