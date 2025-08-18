import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Lab Collections Analytics Hooks
export const useLabCollectionsKPIs = (
  startDate: string,
  endDate: string,
  filters: {
    center?: string;
    city?: string;
    pincode?: string;
    testId?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['lab-collections-kpis', startDate, endDate, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lab_collections_kpis', {
        start_date: startDate,
        end_date: endDate,
        center_filter: filters.center || null,
        city_filter: filters.city || null,
        pincode_filter: filters.pincode || null,
        test_filter: filters.testId || null,
      });
      
      if (error) throw error;
      return data[0] || {
        total_bookings: 0,
        collected_bookings: 0,
        collection_rate: 0,
        lab_revenue: 0,
        center_payouts: 0,
      };
    },
  });
};

export const useLabCollectionsByDay = (
  startDate: string,
  endDate: string,
  filters: {
    center?: string;
    city?: string;
    pincode?: string;
    testId?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['lab-collections-by-day', startDate, endDate, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lab_collections_by_day', {
        start_date: startDate,
        end_date: endDate,
        center_filter: filters.center || null,
        city_filter: filters.city || null,
        pincode_filter: filters.pincode || null,
        test_filter: filters.testId || null,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useLabCollectionsByCenter = (
  startDate: string,
  endDate: string,
  filters: {
    center?: string;
    city?: string;
    pincode?: string;
    testId?: string;
  } = {}
) => {
  return useQuery({
    queryKey: ['lab-collections-by-center', startDate, endDate, filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('lab_collections_by_center', {
        start_date: startDate,
        end_date: endDate,
        center_filter: filters.center || null,
        city_filter: filters.city || null,
        pincode_filter: filters.pincode || null,
        test_filter: filters.testId || null,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Medicine Sales Analytics Hooks
export const useMedicineSalesKPIs = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['medicine-sales-kpis', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('medicine_sales_kpis', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data[0] || {
        gmv: 0,
        total_orders: 0,
        aov: 0,
        prepaid_orders: 0,
        cod_orders: 0,
        prepaid_gmv: 0,
        cod_gmv: 0,
      };
    },
  });
};

export const useMedicineSalesByDay = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['medicine-sales-by-day', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('medicine_sales_by_day', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useTopMedicinesByRevenue = (startDate: string, endDate: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['top-medicines-by-revenue', startDate, endDate, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('top_medicines_by_revenue_detailed', {
        start_date: startDate,
        end_date: endDate,
        limit_count: limit,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useMedicineSalesByStore = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['medicine-sales-by-store', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('medicine_sales_by_store', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Consultation Analytics Hooks
export const useConsultationKPIs = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultation-kpis', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('consultation_kpis', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data[0] || {
        total_consultations: 0,
        completed_consultations: 0,
        completion_rate: 0,
        consultation_revenue: 0,
        care_plus_consultations: 0,
        care_plus_share: 0,
      };
    },
  });
};

export const useConsultationsByDay = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultations-by-day', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('consultations_by_day', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useConsultationsBySpecialty = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultations-by-specialty', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('consultations_by_specialty', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useConsultationsByDoctor = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultations-by-doctor', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('consultations_by_doctor', {
        start_date: startDate,
        end_date: endDate,
      });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Utility function to get all lab tests for filtering
export const useLabTests = () => {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
};