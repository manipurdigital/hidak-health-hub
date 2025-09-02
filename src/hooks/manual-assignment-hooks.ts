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
    onSuccess: (data: any) => {
      const message: string | undefined = data?.whatsapp_message || data?.message;
      const recipientRaw: string | undefined = data?.recipient || data?.adminWhatsApp;
      if (message && recipientRaw) {
        const phone = recipientRaw.toString().replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          navigator.clipboard.writeText(message).then(() => {
            toast({
              title: 'WhatsApp blocked',
              description: 'Message copied to clipboard. Paste it in WhatsApp manually.',
            });
          }).catch(() => {
            toast({
              title: 'Message ready',
              description: 'Please open WhatsApp and paste the prepared message.',
            });
          });
        } else {
          toast({
            title: 'WhatsApp opened',
            description: 'Admin message prepared in WhatsApp for sending.',
          });
        }
      } else {
        toast({
          title: 'Admin notified',
          description: 'Notification prepared successfully.',
        });
      }
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