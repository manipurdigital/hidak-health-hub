import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Rider {
  id: string;
  user_id: string | null;
  code: string;
  full_name: string;
  phone: string | null;
  vehicle_type: 'bike' | 'car' | 'scooter' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryJob {
  id: string;
  order_id: string;
  rider_id: string | null;
  pickup_address: any;
  delivery_address: any;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  estimated_delivery_time: string | null;
  actual_delivery_time: string | null;
  delivery_fee: number;
  distance_km: number | null;
  notes: string | null;
  customer_rating: number | null;
  customer_feedback: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  rider?: Rider;
  order?: any;
}

export interface RiderShift {
  id: string;
  rider_id: string;
  shift_date: string;
  start_time: string;
  end_time: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  earnings: number;
  deliveries_completed: number;
  created_at: string;
  updated_at: string;
  rider?: Rider;
}

// Hooks for Riders
export const useRiders = () => {
  return useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Rider[];
    },
  });
};

export const useActiveRiders = () => {
  return useQuery({
    queryKey: ['riders', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data as Rider[];
    },
  });
};

export const useCreateRider = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rider: Omit<Rider, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('riders')
        .insert(rider)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast({
        title: 'Success',
        description: 'Rider created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRider = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Rider> & { id: string }) => {
      const { data, error } = await supabase
        .from('riders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      toast({
        title: 'Success',
        description: 'Rider updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hooks for Delivery Jobs
export const useDeliveryJobs = () => {
  return useQuery({
    queryKey: ['delivery-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_jobs' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as DeliveryJob[];
    },
  });
};

export const useDeliveryJobsByStatus = (status: DeliveryJob['status']) => {
  return useQuery({
    queryKey: ['delivery-jobs', 'status', status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_jobs' as any)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as DeliveryJob[];
    },
  });
};

export const useRiderJobs = (riderId: string) => {
  return useQuery({
    queryKey: ['delivery-jobs', 'rider', riderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_jobs' as any)
        .select('*')
        .eq('rider_id', riderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as DeliveryJob[];
    },
    enabled: !!riderId,
  });
};

export const useUpdateDeliveryJob = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryJob> & { id: string }) => {
      const { data, error } = await supabase
        .from('delivery_jobs' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-jobs'] });
      toast({
        title: 'Success',
        description: 'Delivery job updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useCreateDeliveryJob = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: Omit<DeliveryJob, 'id' | 'created_at' | 'updated_at' | 'rider'>) => {
      const { data, error } = await supabase
        .from('delivery_jobs' as any)
        .insert(job)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-jobs'] });
      toast({
        title: 'Success',
        description: 'Delivery job created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hooks for Rider Shifts
export const useRiderShifts = (riderId?: string) => {
  return useQuery({
    queryKey: ['rider-shifts', riderId],
    queryFn: async () => {
      let query = supabase
        .from('rider_shifts' as any)
        .select('*')
        .order('shift_date', { ascending: false });

      if (riderId) {
        query = query.eq('rider_id', riderId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as RiderShift[];
    },
  });
};

export const useCreateRiderShift = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shift: Omit<RiderShift, 'id' | 'created_at' | 'updated_at' | 'rider'>) => {
      const { data, error } = await supabase
        .from('rider_shifts' as any)
        .insert(shift)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-shifts'] });
      toast({
        title: 'Success',
        description: 'Rider shift created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateRiderShift = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RiderShift> & { id: string }) => {
      const { data, error } = await supabase
        .from('rider_shifts' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-shifts'] });
      toast({
        title: 'Success',
        description: 'Rider shift updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};