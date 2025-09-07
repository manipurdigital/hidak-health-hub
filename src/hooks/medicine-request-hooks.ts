import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MedicineRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  medicine_names: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'confirmed' | 'rejected' | 'completed';
  admin_notes?: string;
  estimated_price?: number;
  substitutes_available?: boolean;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  completed_at?: string;
}

export const useCreateMedicineRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (request: {
      customer_name: string;
      customer_phone: string;
      medicine_names: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        user_id: user?.id || null,
        customer_name: request.customer_name,
        customer_phone: request.customer_phone,
        medicine_names: request.medicine_names,
        notes: request.notes || null,
      };

      const { data, error } = await supabase
        .from('medicine_requests')
        .insert(payload)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-requests'] });
      toast({
        title: "Request Submitted",
        description: "We'll contact you soon with availability and pricing information.",
      });
    },
    onError: (error) => {
      console.error('Medicine request error:', error);
      toast({
        title: "Request Failed",
        description: "Unable to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useMedicineRequests = () => {
  return useQuery({
    queryKey: ['medicine-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicine_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MedicineRequest[];
    },
  });
};

export const useUserMedicineRequests = () => {
  return useQuery({
    queryKey: ['user-medicine-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('medicine_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MedicineRequest[];
    },
  });
};

export const useUpdateMedicineRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<MedicineRequest> 
    }) => {
      const { data, error } = await supabase
        .from('medicine_requests')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-requests'] });
      toast({
        title: "Request Updated",
        description: "Medicine request has been updated successfully.",
      });
    },
  });
};