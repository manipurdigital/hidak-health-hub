import { useQuery } from '@tanstack/react-query';

// Placeholder analytics hooks with static data until backend functions are implemented

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
      return {
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
      return [];
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
      return [];
    },
  });
};

// Medicine Sales Analytics Hooks
export const useMedicineSalesKPIs = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['medicine-sales-kpis', startDate, endDate],
    queryFn: async () => {
      return {
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
      return [];
    },
  });
};

export const useTopMedicinesByRevenue = (startDate: string, endDate: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['top-medicines-by-revenue', startDate, endDate, limit],
    queryFn: async () => {
      return [];
    },
  });
};

export const useMedicineSalesByStore = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['medicine-sales-by-store', startDate, endDate],
    queryFn: async () => {
      return [];
    },
  });
};

// Consultation Analytics Hooks
export const useConsultationKPIs = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultation-kpis', startDate, endDate],
    queryFn: async () => {
      return {
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
      return [];
    },
  });
};

export const useConsultationsBySpecialty = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultations-by-specialty', startDate, endDate],
    queryFn: async () => {
      return [];
    },
  });
};

export const useConsultationsByDoctor = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultations-by-doctor', startDate, endDate],
    queryFn: async () => {
      return [];
    },
  });
};

// Utility function to get all lab tests for filtering
export const useLabTests = () => {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      return [];
    },
  });
};