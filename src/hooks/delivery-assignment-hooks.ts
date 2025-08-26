import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface DeliveryAssignment {
  id: string;
  order_id: string;
  rider_id: string | null;
  status: 'pending' | 'on_the_way' | 'delivered' | 'cancelled';
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  order_number?: string;
  rider_code?: string;
  rider_name?: string;
  customer_name?: string;
  customer_address?: any;
  dest_lat?: number;
  dest_lng?: number;
}

export interface DeliveryAssignmentFilters {
  status?: string;
  order_number?: string;
  rider_code?: string;
}

// Admin hooks
export function useAdminDeliveryAssignments(filters: DeliveryAssignmentFilters = {}) {
  return useQuery({
    queryKey: ['admin-delivery-assignments', filters],
    queryFn: async () => {
      let query = supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            order_number,
            dest_lat,
            dest_lng,
            shipping_address
          ),
          riders(
            code,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.order_number) {
        query = query.ilike('orders.order_number', `%${filters.order_number}%`);
      }

      if (filters.rider_code) {
        query = query.ilike('riders.code', `%${filters.rider_code}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map((assignment: any) => ({
        ...assignment,
        order_number: assignment.orders?.order_number,
        rider_code: assignment.riders?.code,
        rider_name: assignment.riders?.full_name,
        dest_lat: assignment.orders?.dest_lat,
        dest_lng: assignment.orders?.dest_lng,
        delivery_address: assignment.orders?.shipping_address
      })) as DeliveryAssignment[];
    },
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ order_number, rider_code }: { order_number: string; rider_code: string }) => {
      const { data, error } = await supabase.rpc('admin_assign_rider', {
        p_order_number: order_number,
        p_rider_code: rider_code
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-assignments'] });
      toast({
        title: "Success",
        description: "Rider assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign rider",
        variant: "destructive",
      });
    },
  });
}

export function useForceStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ order_number, status }: { order_number: string; status: string }) => {
      const { error } = await supabase.rpc('admin_set_delivery_status', {
        p_order_number: order_number,
        p_status: status
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-assignments'] });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to update status";
      
      // Map constraint errors to user-friendly messages
      if (error.message?.includes('delivery_assignments_status_check')) {
        errorMessage = "That status needs the required timestamps. Please click the normal action button.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

// Rider hooks
export function useMyRiderJobs() {
  return useQuery({
    queryKey: ['my-rider-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders!inner(
            order_number,
            shipping_address,
            dest_lat,
            dest_lng
          )
        `)
        .in('status', ['pending', 'on_the_way'])
        .order('assigned_at', { ascending: true });

      if (error) throw error;

      return data.map((assignment: any) => ({
        ...assignment,
        order_number: assignment.orders?.order_number,
        customer_address: assignment.orders?.shipping_address,
        dest_lat: assignment.orders?.dest_lat,
        dest_lng: assignment.orders?.dest_lng,
      })) as DeliveryAssignment[];
    },
  });
}

export function useRiderStart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order_id: string) => {
      const { error } = await supabase.rpc('rider_start', {
        p_order_id: order_id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rider-jobs'] });
      toast({
        title: "Success",
        description: "Trip started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start trip",
        variant: "destructive",
      });
    },
  });
}

export function useRiderComplete() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (order_id: string) => {
      const { error } = await supabase.rpc('rider_complete', {
        p_order_id: order_id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-rider-jobs'] });
      toast({
        title: "Success",
        description: "Delivery completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete delivery",
        variant: "destructive",
      });
    },
  });
}

// Utility hooks
export function useActiveRiders() {
  return useQuery({
    queryKey: ['active-riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('riders')
        .select('id, code, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}