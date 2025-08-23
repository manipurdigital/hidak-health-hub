import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Medicine Categories
export const useMedicineCategories = () => {
  return useQuery({
    queryKey: ['medicine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicine_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateMedicineCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: { name: string; description?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('medicine_categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMedicineCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; name?: string; description?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('medicine_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMedicineCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medicine_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Lab Test Categories
export const useLabTestCategories = () => {
  return useQuery({
    queryKey: ['lab-test-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_test_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLabTestCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: { name: string; description?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('lab_test_categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-categories'] });
      toast({
        title: "Success",
        description: "Lab test category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateLabTestCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string; name?: string; description?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from('lab_test_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-categories'] });
      toast({
        title: "Success",
        description: "Lab test category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteLabTestCategory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lab_test_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-categories'] });
      toast({
        title: "Success",
        description: "Lab test category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};