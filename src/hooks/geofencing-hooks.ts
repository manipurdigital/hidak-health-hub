import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Geofence {
  id: string;
  name: string;
  center_id: string | null;
  store_id: string | null;
  service_type: 'delivery' | 'lab_collection';
  polygon_coordinates: any; // GeoJSON
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  center_name?: string;
  store_name?: string;
}

export interface CreateGeofenceData {
  name: string;
  center_id?: string;
  store_id?: string;
  service_type: 'delivery' | 'lab_collection';
  polygon: any; // This matches the database column name
  priority?: number;
  is_active?: boolean;
}

// Hook to get all geofences
export const useGeofences = (serviceType?: string) => {
  return useQuery({
    queryKey: ['geofences', serviceType],
    queryFn: async () => {
      let query = supabase
        .from('geofences')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
  });
};

// Hook to get centers for dropdowns
export const useCentersAndStores = () => {
  return useQuery({
    queryKey: ['centers-and-stores'],
    queryFn: async () => {
      const [centersResult, storesResult] = await Promise.all([
        supabase
          .from('diagnostic_centers')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('stores')
          .select('id, name')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (centersResult.error) throw centersResult.error;
      if (storesResult.error) throw storesResult.error;

      return {
        centers: centersResult.data || [],
        stores: storesResult.data || [],
      };
    },
  });
};

// Hook to create geofence
export const useCreateGeofence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGeofenceData) => {
      const { error } = await supabase
        .from('geofences')
         .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast({
        title: "Success",
        description: "Geofence created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create geofence. Please try again.",
        variant: "destructive",
      });
      console.error('Create geofence error:', error);
    },
  });
};

// Hook to update geofence
export const useUpdateGeofence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateGeofenceData> }) => {
      const { error } = await supabase
        .from('geofences')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast({
        title: "Success",
        description: "Geofence updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update geofence. Please try again.",
        variant: "destructive",
      });
      console.error('Update geofence error:', error);
    },
  });
};

// Hook to delete geofence
export const useDeleteGeofence = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('geofences')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast({
        title: "Success",
        description: "Geofence deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete geofence. Please try again.",
        variant: "destructive",
      });
      console.error('Delete geofence error:', error);
    },
  });
};

// Hook to check serviceability
export const useCheckServiceability = () => {
  return useMutation({
    mutationFn: async ({ lat, lng, serviceType }: { 
      lat: number; 
      lng: number; 
      serviceType: 'delivery' | 'lab_collection' 
    }) => {
      const { data, error } = await supabase.rpc('get_available_centers_for_location', {
        p_lat: lat,
        p_lng: lng,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Get coverage areas for a location (even without partners)
export const useCoverage = () => {
  return useMutation({
    mutationFn: async ({ lat, lng, serviceType }: { lat: number; lng: number; serviceType: 'delivery' | 'lab_collection' }) => {
      const { data, error } = await supabase.rpc('get_service_coverage' as any, {
        lat,
        lng,
        service_type: serviceType
      });

      if (error) {
        console.error('Error checking coverage:', error);
        throw error;
      }

      return data;
    },
  });
};

// Preview delivery fee for a location
export const useFeePreview = () => {
  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      const { data, error } = await supabase.rpc('calc_distance_fee_from_geofence' as any, {
        p_service: 'delivery',
        p_dest_p_lat: lat,
        p_dest_lng: lng,
      });

      if (error) {
        console.error('Error previewing fee:', error);
        throw error;
      }

      return data?.[0] ?? null;
    },
  });
};