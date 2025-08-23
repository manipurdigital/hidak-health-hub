import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Medicines
export const useMedicines = () => {
  return useQuery({
    queryKey: ['medicines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

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

// Lab Tests
export const useLabTests = () => {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
};

// Lab Bookings
export const useLabBookings = () => {
  return useQuery({
    queryKey: ['lab-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          test:lab_tests(name, price)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateLabBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (booking: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please sign in to book a lab test.');

      // Map incoming shapes to edge function payload
      const payload = {
        testId: booking.testId ?? booking.test_id,
        bookingDate: booking.bookingDate ?? booking.booking_date,
        timeSlot: booking.timeSlot ?? booking.time_slot,
        patientName: booking.patientName ?? booking.patient_name,
        patientPhone: booking.patientPhone ?? booking.patient_phone,
        patientEmail: booking.patientEmail ?? booking.patient_email,
        specialInstructions: booking.specialInstructions ?? booking.special_instructions,
      };

      const { data, error } = await supabase.functions.invoke('create-lab-booking', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
      toast({
        title: "Booking Created",
        description: "Lab test booking created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Failed to book lab test. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Doctors
export const useDoctors = () => {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Consultations
export const useConsultations = () => {
  return useQuery({
    queryKey: ['consultations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:doctors(full_name, specialization, profile_image_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateConsultation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (consultation: any) => {
      const { data, error } = await supabase
        .from('consultations')
        .insert(consultation)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast({
        title: "Success",
        description: "Consultation booked successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Orders
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            medicine:medicines(name, brand, image_url)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: any) => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData.order)
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Insert order items
      const orderItems = orderData.items.map((item: any) => ({
        ...item,
        order_id: order.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Subscriptions
export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      
      if (error) throw error;
      return data;
    },
  });
};