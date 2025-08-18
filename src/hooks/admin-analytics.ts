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
      const { data, error } = await supabase.rpc('admin_kpi_overview', {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      return data?.[0] as KPIData;
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
      const { data, error } = await supabase.rpc('admin_timeseries_data', {
        metric_type: metric,
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0]
      });
      
      if (error) throw error;
      return data as TimeseriesData[];
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
      const { data, error } = await supabase.rpc('revenue_breakdown', {
        breakdown_by: breakdownBy,
        start_ts: start.toISOString(),
        end_ts: end.toISOString()
      });
      
      if (error) throw error;
      return data as BreakdownData[];
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
      const { data, error } = await supabase.rpc('admin_top_medicines', {
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        limit_count: limit
      });
      
      if (error) throw error;
      return data as TopMedicineData[];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });
}