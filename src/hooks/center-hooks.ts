import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTriggerNotification } from './notification-hooks';

// Get center bookings for the logged-in center staff
export function useCenterBookings() {
  return useQuery({
    queryKey: ['center-bookings'],
    queryFn: async () => {
      // Get user's center from center_staff table
      const { data: staffData, error: staffError } = await supabase
        .from('center_staff')
        .select('center_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .single();

      if (staffError) throw staffError;

      // Get bookings for this center using the RPC function
      const { data, error } = await supabase.rpc('get_center_bookings', {
        p_center_id: staffData.center_id
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Update lab booking status and details
export const useUpdateLabBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const triggerNotification = useTriggerNotification();

  return useMutation({
    mutationFn: async (updates: {
      id: string;
      status?: string;
      collector_name?: string;
      eta?: string;
      collected_at?: string;
      reschedule_reason?: string;
      special_instructions?: string;
    }) => {
      const { id, ...updateData } = updates;
      
      const { data, error } = await supabase
        .from('lab_bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['center-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
      
      // Trigger notifications based on status change
      if (variables.status) {
        const notificationData = getNotificationData(variables.status, data);
        if (notificationData) {
          triggerNotification.mutate({
            eventType: notificationData.eventType,
            bookingId: variables.id,
            title: notificationData.title,
            message: notificationData.message,
          });
        }
      }
    },
    onError: (error) => {
      console.error('Update booking error:', error);
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Get center metrics and KPIs
export function useCenterMetrics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['center-metrics', dateFrom, dateTo],
    queryFn: async () => {
      // Get user's center from center_staff table
      const { data: staffData, error: staffError } = await supabase
        .from('center_staff')
        .select('center_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .single();

      if (staffError) throw staffError;

      // Get metrics for this center
      const { data, error } = await supabase.rpc('get_center_metrics', {
        p_center_id: staffData.center_id,
        p_date_from: dateFrom || undefined,
        p_date_to: dateTo || undefined
      });

      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

// Get center details
export function useCenterDetails() {
  return useQuery({
    queryKey: ['center-details'],
    queryFn: async () => {
      // Get user's center from center_staff table
      const { data: staffData, error: staffError } = await supabase
        .from('center_staff')
        .select(`
          center_id,
          role,
          diagnostic_centers!inner(
            id,
            name,
            email,
            contact_phone,
            address,
            platform_commission_rate
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .single();

      if (staffError) throw staffError;
      return staffData;
    },
  });
}

// Admin function to link center account
export function useAdminLinkCenterAccount() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      centerId, 
      role = 'center' 
    }: {
      userId: string;
      centerId: string;
      role?: string;
    }) => {
      const { error } = await supabase.rpc('admin_link_center_account', {
        p_user_id: userId,
        p_center_id: centerId,
        p_role: role
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "Center account linked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to link center account",
        variant: "destructive",
      });
    },
  });
}

// Helper function to get notification data based on status
const getNotificationData = (status: string, booking: any) => {
  switch (status) {
    case 'assigned':
      return {
        eventType: 'booking_assigned',
        title: 'Lab Test Assigned',
        message: `Lab test ${booking.test?.name || 'booking'} has been assigned to a collection center.`,
      };
    case 'en_route':
      return {
        eventType: 'status_en_route',
        title: 'Collector En Route',
        message: `Sample collector is on the way for ${booking.test?.name || 'lab test'}.`,
      };
    case 'collected':
      return {
        eventType: 'status_collected',
        title: 'Sample Collected',
        message: `Sample has been collected for ${booking.test?.name || 'lab test'}.`,
      };
    case 'reschedule_requested':
      return {
        eventType: 'reschedule_requested',
        title: 'Reschedule Requested',
        message: `Reschedule has been requested for ${booking.test?.name || 'lab test'}.`,
      };
    default:
      return null;
  }
};