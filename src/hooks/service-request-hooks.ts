import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServiceRequestData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: any;
  customerLat?: number;
  customerLng?: number;
  customerGender?: string;
  services: string[];
  items: ServiceRequestItem[];
  files?: ServiceRequestFile[];
}

export interface ServiceRequestItem {
  serviceType: string;
  itemType: string;
  itemValue: string;
  quantity?: number;
  notes?: string;
}

export interface ServiceRequestFile {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export const useCreateServiceRequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceRequestData) => {
      // Create the service request
      const { data: request, error: requestError } = await supabase
        .from('service_requests')
        .insert({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_email: data.customerEmail,
          customer_address: data.customerAddress,
          customer_lat: data.customerLat,
          customer_lng: data.customerLng,
          customer_gender: data.customerGender,
          services: data.services,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create service request items
      if (data.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('service_request_items')
          .insert(
            data.items.map(item => ({
              request_id: request.id,
              service_type: item.serviceType,
              item_type: item.itemType,
              item_value: item.itemValue,
              quantity: item.quantity || 1,
              notes: item.notes,
            }))
          );

        if (itemsError) throw itemsError;
      }

      // Create service request files
      if (data.files && data.files.length > 0) {
        const { error: filesError } = await supabase
          .from('service_request_files')
          .insert(
            data.files.map(file => ({
              request_id: request.id,
              file_name: file.fileName,
              file_path: file.filePath,
              file_type: file.fileType,
              file_size: file.fileSize,
            }))
          );

        if (filesError) throw filesError;
      }

      return request;
    },
    onSuccess: () => {
      toast({
        title: "Request submitted successfully",
        description: "We'll contact you soon with pricing and availability.",
      });
      queryClient.invalidateQueries({ queryKey: ['serviceRequests'] });
    },
    onError: (error) => {
      console.error('Error creating service request:', error);
      toast({
        title: "Failed to submit request",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });
};

export const useServiceRequests = () => {
  return useQuery({
    queryKey: ['serviceRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          service_request_items(*),
          service_request_files(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUploadServiceRequestFile = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to upload files');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('intake-uploads')
        .upload(filePath, file);

      if (error) throw error;

      return {
        fileName: file.name,
        filePath: data.path,
        fileType: folder,
        fileSize: file.size,
      };
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Please try uploading the file again.",
        variant: "destructive",
      });
    },
  });
};