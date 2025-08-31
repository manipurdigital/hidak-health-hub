import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface KPIData {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  new_users: number;
  conversion_rate: number;
  active_subscriptions: number;
  prev_revenue: number;
  prev_orders: number;
  prev_aov: number;
  prev_new_users: number;
  revenue_growth: number;
  order_growth: number;
}

export interface TimeseriesData {
  date: string;
  value: number;
}

export interface BreakdownData {
  category: string;
  revenue: number;
  orders: number;
}

export interface TopMedicineData {
  medicine_name: string;
  total_revenue: number;
  total_quantity: number;
  order_count: number;
  unique_customers?: number;
}

export type DateRange = '7d' | '28d' | '90d' | 'custom';

export function getDateRange(range: DateRange, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  const end = endOfDay(now);
  
  switch (range) {
    case '7d':
      return { start: startOfDay(subDays(now, 7)), end };
    case '28d':
      return { start: startOfDay(subDays(now, 28)), end };
    case '90d':
      return { start: startOfDay(subDays(now, 90)), end };
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfDay(subDays(now, 7)),
        end: customEnd ? endOfDay(customEnd) : end
      };
    default:
      return { start: startOfDay(subDays(now, 7)), end };
  }
}

export function useKPIData(dateRange: DateRange, customStart?: Date, customEnd?: Date) {
  const { start, end } = getDateRange(dateRange, customStart, customEnd);
  
  return useQuery({
    queryKey: ['admin-kpi', start.toISOString(), end.toISOString()],
    queryFn: async () => {
      // Placeholder implementation until the function is available
      const placeholderData: KPIData = {
        total_revenue: 0,
        total_orders: 0,
        avg_order_value: 0,
        new_users: 0,
        conversion_rate: 0,
        active_subscriptions: 0,
        prev_revenue: 0,
        prev_orders: 0,
        prev_aov: 0,
        prev_new_users: 0,
        revenue_growth: 0,
        order_growth: 0
      };
      return placeholderData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTimeseriesData(
  metric: 'revenue' | 'orders', 
  granularity: 'day' | 'week' | 'month',
  dateRange: DateRange,
  customStart?: Date,
  customEnd?: Date
) {
  const { start, end } = getDateRange(dateRange, customStart, customEnd);
  
  return useQuery({
    queryKey: ['admin-timeseries', metric, granularity, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      // Placeholder implementation until the function is available
      const placeholderData: TimeseriesData[] = [
        { date: start.toISOString().split('T')[0], value: 0 }
      ];
      return placeholderData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevenueBreakdown(
  breakdownBy: 'payment_method' | 'status',
  dateRange: DateRange,
  customStart?: Date,
  customEnd?: Date
) {
  const { start, end } = getDateRange(dateRange, customStart, customEnd);
  
  return useQuery({
    queryKey: ['admin-breakdown', breakdownBy, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      // Placeholder implementation until the function is available
      const placeholderData: BreakdownData[] = [
        { category: 'placeholder', revenue: 0, orders: 0 }
      ];
      return placeholderData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopMedicines(
  dateRange: DateRange,
  customStart?: Date,
  customEnd?: Date,
  limit: number = 10
) {
  const { start, end } = getDateRange(dateRange, customStart, customEnd);
  
  return useQuery({
    queryKey: ['admin-top-medicines', start.toISOString(), end.toISOString(), limit],
    queryFn: async () => {
      // Placeholder implementation until the function is available
      const placeholderData: TopMedicineData[] = [
        { 
          medicine_name: 'placeholder', 
          total_revenue: 0, 
          total_quantity: 0, 
          order_count: 0,
          unique_customers: 0
        }
      ];
      return placeholderData;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}