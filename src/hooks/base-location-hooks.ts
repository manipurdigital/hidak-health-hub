
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BaseLocation {
  id: string;
  name: string;
  service_type: string;
  geofence_id?: string;
  base_lat: number;
  base_lng: number;
  base_fare: number;
  per_km_fee: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateBaseLocationData {
  name: string;
  service_type: string;
  geofence_id?: string;
  base_lat: number;
  base_lng: number;
  base_fare: number;
  per_km_fee: number;
  priority?: number;
  is_active?: boolean;
}

// Hook to get all base locations
export const useBaseLocations = () => {
  return useQuery({
    queryKey: ['base-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_base_locations')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to create base location
export const useCreateBaseLocation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBaseLocationData) => {
      const { error } = await supabase
        .from('delivery_base_locations')
        .insert({
          ...data,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast({
        title: "Success",
        description: "Base location created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create base location. Please try again.",
        variant: "destructive",
      });
      console.error('Create base location error:', error);
    },
  });
};

// Hook to update base location
export const useUpdateBaseLocation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBaseLocationData> }) => {
      const { error } = await supabase
        .from('delivery_base_locations')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast({
        title: "Success",
        description: "Base location updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update base location. Please try again.",
        variant: "destructive",
      });
      console.error('Update base location error:', error);
    },
  });
};

// Hook to delete base location
export const useDeleteBaseLocation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_base_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-locations'] });
      toast({
        title: "Success",
        description: "Base location deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete base location. Please try again.",
        variant: "destructive",
      });
      console.error('Delete base location error:', error);
    },
  });
};

// Hook to test fee calculation
export const useTestFeeCalculation = () => {
  return useMutation({
    mutationFn: async ({ lat, lng, serviceType }: { 
      lat: number; 
      lng: number; 
      serviceType: string 
    }) => {
      const { data, error } = await supabase.rpc('calc_delivery_fee_from_base', {
        p_service: serviceType,
        p_dest_lat: lat,
        p_dest_lng: lng,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};
