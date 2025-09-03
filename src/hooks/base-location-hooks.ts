import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BaseLocation {
  id: string;
  name: string;
  service_type: string;
  base_lat: number;
  base_lng: number;
  base_fare: number;
  base_km: number;
  per_km_fee: number;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const useBaseLocations = () => {
  return useQuery({
    queryKey: ['base-locations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_base_locations');
      if (error) throw error;
      return (data || []) as BaseLocation[];
    },
  });
};

export const useCreateBaseLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (location: Omit<BaseLocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.rpc('create_base_location', {
        p_name: location.name,
        p_service_type: location.service_type,
        p_base_lat: location.base_lat,
        p_base_lng: location.base_lng,
        p_base_fare: location.base_fare,
        p_base_km: location.base_km,
        p_per_km_fee: location.per_km_fee,
        p_priority: location.priority,
        p_is_active: location.is_active,
        p_is_default: location.is_default
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast.success('Base location created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create base location');
    },
  });
};

export const useUpdateBaseLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BaseLocation> }) => {
      const { data: result, error } = await supabase.rpc('update_base_location', {
        p_id: id,
        p_name: data.name,
        p_service_type: data.service_type,
        p_base_lat: data.base_lat,
        p_base_lng: data.base_lng,
        p_base_fare: data.base_fare,
        p_base_km: data.base_km,
        p_per_km_fee: data.per_km_fee,
        p_priority: data.priority,
        p_is_active: data.is_active,
        p_is_default: data.is_default
      });
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast.success('Base location updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update base location');
    },
  });
};

export const useDeleteBaseLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_base_location', { p_id: id });
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast.success('Base location deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete base location');
    },
  });
};