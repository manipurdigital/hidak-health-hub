import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotifyAdminParams {
  type: 'new_order' | 'new_lab_booking';
  entityId: string;
  adminWhatsApp?: string;
}

export const useNotifyAdminWhatsApp = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ type, entityId, adminWhatsApp }: NotifyAdminParams) => {
      const { data, error } = await supabase.functions.invoke('whatsapp-admin-notification', {
        body: { type, entityId, adminWhatsApp }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Admin notified",
        description: "WhatsApp notification sent to admin successfully.",
      });
    },
    onError: (error) => {
      console.error('WhatsApp notification error:', error);
      toast({
        title: "Notification failed",
        description: "Failed to send WhatsApp notification to admin.",
        variant: "destructive",
      });
    },
  });
};

export const useValidateServiceArea = () => {
  return useMutation({
    mutationFn: async ({ 
      lat, 
      lng, 
      serviceType 
    }: { 
      lat: number; 
      lng: number; 
      serviceType: string; 
    }) => {
      const { data, error } = await supabase.rpc('is_location_serviceable', {
        p_lat: lat,
        p_lng: lng,
        p_service_type: serviceType
      });

      if (error) throw error;
      return data;
    }
  });
};

export const useUpdateServiceArea = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      entityId, 
      entityType, 
      isWithinServiceArea,
      lat,
      lng
    }: { 
      entityId: string; 
      entityType: 'order' | 'lab_booking';
      isWithinServiceArea: boolean;
      lat: number;
      lng: number;
    }) => {
      const tableName = entityType === 'order' ? 'orders' : 'lab_bookings';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          is_within_service_area: isWithinServiceArea,
          geofence_validated_at: new Date().toISOString()
        })
        .eq('id', entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update service area validation.",
        variant: "destructive",
      });
    }
  });
};