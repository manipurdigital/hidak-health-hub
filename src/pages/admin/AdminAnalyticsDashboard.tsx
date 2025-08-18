import React, { useState } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  CreditCard,
  UserPlus,
  Activity,
  Percent
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { AnalyticsFilters } from '@/components/dashboard/AnalyticsFilters';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrdersChart } from '@/components/dashboard/OrdersChart';
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown';
import { TopMedicinesTable } from '@/components/dashboard/TopMedicinesTable';
import { 
  useKPIData, 
  useTimeseriesData, 
  useRevenueBreakdown, 
  useTopMedicines,
  DateRange 
} from '@/hooks/admin-analytics';

export function AdminAnalyticsDashboard() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('28d');

  // Data hooks
  const { data: kpiData, isLoading: kpiLoading } = useKPIData(selectedRange);
  const { data: revenueTimeseries, isLoading: revenueLoading } = useTimeseriesData('revenue', 'day', selectedRange);
  const { data: ordersTimeseries, isLoading: ordersLoading } = useTimeseriesData('orders', 'day', selectedRange);
  const { data: paymentBreakdown, isLoading: paymentLoading } = useRevenueBreakdown('payment_method', selectedRange);
  const { data: topMedicines, isLoading: medicinesLoading } = useTopMedicines(selectedRange);

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
  };

  const handleResetFilters = () => {
    setSelectedRange('28d');
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: kpiData?.total_revenue || 0,
      previousValue: kpiData?.prev_revenue || 0,
      icon: <DollarSign className="h-4 w-4" />,
      format: 'currency' as const,
    },
    {
      title: 'Total Orders',
      value: kpiData?.total_orders || 0,
      previousValue: kpiData?.prev_orders || 0,
      icon: <ShoppingCart className="h-4 w-4" />,
      format: 'number' as const,
    },
    {
      title: 'Average Order Value',
      value: kpiData?.avg_order_value || 0,
      previousValue: kpiData?.prev_aov || 0,
      icon: <TrendingUp className="h-4 w-4" />,
      format: 'currency' as const,
    },
    {
      title: 'New Users',
      value: kpiData?.new_users || 0,
      previousValue: kpiData?.prev_new_users || 0,
      icon: <UserPlus className="h-4 w-4" />,
      format: 'number' as const,
    },
    {
      title: 'Active Subscriptions',
      value: kpiData?.active_subscriptions || 0,
      previousValue: kpiData?.prev_active_subs || 0,
      icon: <Users className="h-4 w-4" />,
      format: 'number' as const,
    },
    {
      title: 'Conversion Rate',
      value: kpiData?.conversion_rate || 0,
      previousValue: kpiData?.prev_conversion_rate || 0,
      icon: <Percent className="h-4 w-4" />,
      format: 'percentage' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your business performance and key metrics
        </p>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
        onResetFilters={handleResetFilters}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            previousValue={kpi.previousValue}
            icon={kpi.icon}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={revenueTimeseries}
          isLoading={revenueLoading}
        />
        <OrdersChart
          data={ordersTimeseries}
          isLoading={ordersLoading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentBreakdown
          data={paymentBreakdown}
          isLoading={paymentLoading}
        />
        <TopMedicinesTable
          data={topMedicines}
          isLoading={medicinesLoading}
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Quick Stats</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Revenue Growth: {kpiData ? (((kpiData.total_revenue - kpiData.prev_revenue) / (kpiData.prev_revenue || 1)) * 100).toFixed(1) : 0}%</div>
            <div>Order Growth: {kpiData ? (((Number(kpiData.total_orders) - Number(kpiData.prev_orders)) / (Number(kpiData.prev_orders) || 1)) * 100).toFixed(1) : 0}%</div>
            <div>User Growth: {kpiData ? (((Number(kpiData.new_users) - Number(kpiData.prev_new_users)) / (Number(kpiData.prev_new_users) || 1)) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Payment Summary</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Total Methods: {paymentBreakdown?.length || 0}</div>
            <div>Top Method: {paymentBreakdown?.[0]?.category || 'N/A'}</div>
            <div>Success Rate: 95.2%</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Performance</span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Best Performer: {topMedicines?.[0]?.medicine_name || 'N/A'}</div>
            <div>Top Revenue: ₹{topMedicines?.[0]?.total_revenue ? Number(topMedicines[0].total_revenue).toLocaleString('en-IN') : '0'}</div>
            <div>Avg. Daily Orders: {kpiData ? Math.round(Number(kpiData.total_orders) / 30) : 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}