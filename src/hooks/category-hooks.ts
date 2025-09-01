import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
      return data || [];
    },
  });
};

export const useCreateMedicineCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('medicine_categories')
        .insert([category])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create medicine category.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMedicineCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      const { data: updatedData, error } = await supabase
        .from('medicine_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medicine category.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMedicineCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('medicine_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-categories'] });
      toast({
        title: "Success",
        description: "Medicine category deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete medicine category.",
        variant: "destructive",
      });
    },
  });
};

// Lab Test Categories (using lab_tests table with category field)
export const useLabTestCategories = () => {
  return useQuery({
    queryKey: ['lab-test-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category))]
        .filter(Boolean)
        .map((category, index) => ({
          id: `lab-cat-${index}`,
          name: category,
          type: 'lab_test'
        }));
      
      return uniqueCategories;
    },
  });
};

export const useCreateLabTestCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string; description?: string }) => {
      // For lab test categories, we'll create a sample lab test with this category
      const { data, error } = await supabase
        .from('lab_tests')
        .insert([{
          name: `Sample ${category.name} Test`,
          category: category.name,
          price: 0,
          description: category.description || `Sample test for ${category.name} category`,
          is_available: false, // Mark as unavailable since it's just for category creation
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { id: `lab-cat-${Date.now()}`, name: category.name, type: 'lab_test' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-categories'] });
      toast({
        title: "Success",
        description: "Lab test category created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lab test category.",
        variant: "destructive",
      });
    },
  });
};

// Legacy exports for backward compatibility
export const useCategories = useMedicineCategories;
export const useCreateCategory = useCreateMedicineCategory;
export const useUpdateCategory = useUpdateMedicineCategory;
export const useDeleteCategory = useDeleteMedicineCategory;