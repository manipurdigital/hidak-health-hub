// @ts-nocheck
import { useQuery } from '@tanstack/react-query';

export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        newUsers: 0
      };
    },
  });
};

export const useKPIData = () => {
  return useQuery({
    queryKey: ['kpi-data'],
    queryFn: async () => {
      return {
        revenue: 0,
        orders: 0,
        customers: 0,
        growth: 0
      };
    },
  });
};

export const useLabCollectionsKPIs = () => {
  return useQuery({
    queryKey: ['lab-collections-kpis'],
    queryFn: async () => {
      return {
        totalCollections: 0,
        todayCollections: 0,
        pendingCollections: 0,
        revenue: 0
      };
    },
  });
};

export const useLabCollectionsByDay = () => {
  return useQuery({
    queryKey: ['lab-collections-by-day'],
    queryFn: async () => {
      return [];
    },
  });
};