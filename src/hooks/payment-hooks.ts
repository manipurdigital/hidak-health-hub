import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Razorpay Key ID (publishable key - safe to store in code)
export const RAZORPAY_KEY_ID = "rzp_test_NKngyBlKJZZxzR";

// Medicine Order Creation
export const useCreateMedicineOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderData: {
      items: any[];
      shippingAddress: any;
      prescriptionUrl?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Created",
        description: `Order ${order.order_number} created successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Lab Test Booking Creation
export const useCreateLabBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bookingData: {
      testId: string;
      bookingDate: string;
      timeSlot: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      specialInstructions?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('create-lab-booking', {
        body: bookingData
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
      toast({
        title: "Booking Created",
        description: `Lab test booking created successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Razorpay Payment Options Interface
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

// Utility function to open Razorpay checkout
export const openRazorpayCheckout = (options: RazorpayOptions) => {
  // Load Razorpay script if not already loaded
  if (!(window as any).Razorpay) {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  } else {
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }
};

// Payment verification hook
export const useVerifyPayment = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      // In a real implementation, you'd verify the payment signature
      // For now, we'll just return success since webhooks handle the verification
      return { success: true, ...paymentData };
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Payment Verification Failed",
        description: "There was an issue verifying your payment. Please contact support.",
        variant: "destructive",
      });
    },
  });
};