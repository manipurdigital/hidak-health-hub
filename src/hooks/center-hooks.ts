import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTriggerNotification } from './notification-hooks';

// Fetch bookings for center staff
export const useCenterBookings = () => {
  return useQuery({
    queryKey: ['center-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          test:lab_tests(name, price, category)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

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