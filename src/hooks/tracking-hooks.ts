import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CourierLocation {
  id: string;
  center_id: string | null;
  center_type: 'lab' | 'delivery';
  booking_id: string | null;
  order_id: string | null;
  lat: number;
  lng: number;
  speed_mps: number;
  heading: number;
  recorded_at: string;
}

export interface TrackingJob {
  id: string;
  type: 'lab' | 'delivery';
  status: string;
  customer_name: string;
  destination_address: string;
  last_eta_mins: number | null;
  last_distance_meters: number | null;
  tracking_token: string | null;
}

// Hook to get center jobs for tracking
export const useCenterJobs = (centerType: 'lab' | 'delivery') => {
  return useQuery({
    queryKey: ['center-jobs', centerType],
    queryFn: async () => {
      if (centerType === 'lab') {
        const { data, error } = await supabase
          .from('lab_bookings')
          .select(`
            id,
            patient_name,
            patient_phone,
            booking_date,
            time_slot,
            status,
            last_eta_mins,
            last_distance_meters,
            tracking_token,
            test_id
          `)
          .in('status', ['assigned', 'en_route', 'collected'])
          .order('booking_date', { ascending: true });

        if (error) throw error;
        
        return data.map(booking => ({
          id: booking.id,
          type: 'lab' as const,
          status: booking.status || 'pending',
          customer_name: booking.patient_name || 'Patient',
          destination_address: booking.patient_phone || 'Address not available',
          last_eta_mins: booking.last_eta_mins,
          last_distance_meters: booking.last_distance_meters,
          tracking_token: booking.tracking_token,
          test_name: 'Lab Test'
        }));
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            status,
            shipping_address,
            last_eta_mins,
            last_distance_meters,
            tracking_token,
            total_amount
          `)
          .in('status', ['packed', 'out_for_delivery', 'delivered'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(order => {
          const shippingAddr = order.shipping_address as any;
          return {
            id: order.id,
            type: 'delivery' as const,
            status: order.status || 'pending',
            customer_name: shippingAddr?.name || 'Customer',
            destination_address: `${shippingAddr?.address_line_1 || 'Address'}, ${shippingAddr?.city || 'City'}`,
            last_eta_mins: order.last_eta_mins,
            last_distance_meters: order.last_distance_meters,
            tracking_token: order.tracking_token
          };
        });
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Hook to get latest courier location for a job
export const useCourierLocation = (jobType: 'lab' | 'delivery', jobId: string) => {
  return useQuery({
    queryKey: ['courier-location', jobType, jobId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_latest_courier_location', {
        job_type: jobType,
        job_id: jobId
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!jobId,
  });
};

// Hook to update job status
export const useUpdateJobStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      jobType, 
      jobId, 
      status 
    }: { 
      jobType: 'lab' | 'delivery'; 
      jobId: string; 
      status: string;
    }) => {
      if (jobType === 'lab') {
        const { error } = await supabase
          .from('lab_bookings')
          .update({ status })
          .eq('id', jobId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', jobId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { jobType }) => {
      queryClient.invalidateQueries({ queryKey: ['center-jobs', jobType] });
      toast({
        title: "Status Updated",
        description: "Job status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job status. Please try again.",
        variant: "destructive",
      });
      console.error('Status update error:', error);
    },
  });
};

// Hook to send location updates
export const useSendLocationUpdate = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      centerId,
      centerType,
      jobId,
      jobType,
      latitude,
      longitude,
      speed = 0,
      heading = 0
    }: {
      centerId: string;
      centerType: 'lab' | 'delivery';
      jobId: string;
      jobType: 'lab' | 'delivery';
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    }) => {
      const locationData = {
        center_id: centerId,
        center_type: centerType,
        lat: latitude,
        lng: longitude,
        speed_mps: speed,
        heading: heading,
        ...(jobType === 'lab' ? { booking_id: jobId } : { order_id: jobId })
      };

      const { error } = await supabase
        .from('courier_locations')
        .insert(locationData);

      if (error) throw error;
    },
    onError: (error) => {
      console.error('Location update error:', error);
      // Don't show toast for location errors to avoid spam
    },
  });
};

// Hook for public tracking by token with expiry validation
export const usePublicTracking = (
  type: 'lab' | 'order',
  id: string,
  token: string
) => {
  return useQuery({
    queryKey: ['public-tracking', type, id, token],
    queryFn: async () => {
      if (!id || !token) return null;

      if (type === 'lab') {
        const { data, error } = await supabase.rpc('get_lab_booking_by_token', {
          booking_id: id,
          token: token
        });
        
        if (error) {
          console.error('Error fetching lab booking tracking:', error);
          return null;
        }
        
        return data?.[0] || null;
      } else {
        const { data, error } = await supabase.rpc('get_order_by_token', {
          order_id: id,
          token: token
        });
        
        if (error) {
          console.error('Error fetching order tracking:', error);
          return null;
        }
        
        return data?.[0] || null;
      }
    },
    enabled: !!id && !!token,
    retry: false, // Don't retry failed requests for expired tokens
    refetchInterval: (data: any) => {
      // Stop polling if no data (expired/invalid token) or if completed
      if (!data || data?.status === 'delivered' || data?.status === 'collected') {
        return false;
      }
      // Poll every 15 seconds for active tracking
      return 15000;
    }
  });
};

// Hook to get all courier locations for admin live map
export const useAllCourierLocations = (filters?: {
  type?: 'lab' | 'delivery';
  centerId?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ['all-courier-locations', filters],
    queryFn: async () => {
      let query = supabase
        .from('courier_locations')
        .select(`
          *,
          lab_bookings(id, patient_name, status, lab_tests(name)),
          orders(id, order_number, status, shipping_address)
        `)
        .order('recorded_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('center_type', filters.type);
      }

      if (filters?.centerId) {
        query = query.eq('center_id', filters.centerId);
      }

      const { data, error } = await query.limit(100); // Limit to recent locations

      if (error) throw error;
      return data || [];
    },
    enabled: true,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};