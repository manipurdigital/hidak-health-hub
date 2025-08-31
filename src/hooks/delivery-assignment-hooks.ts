// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeliveryAssignments = () => {
  return useQuery({
    queryKey: ['delivery-assignments'],
    queryFn: async () => [],
  });
};

export const useRiderJobs = () => {
  return useQuery({
    queryKey: ['rider-jobs'],
    queryFn: async () => [],
  });
};

export const useMyRiderJobs = () => {
  return useQuery({
    queryKey: ['my-rider-jobs'],
    queryFn: async () => [],
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-jobs'] });
    },
  });
};