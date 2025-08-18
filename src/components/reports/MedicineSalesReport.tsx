import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KPICard } from '@/components/dashboard/KPICard';
import { SimpleKPICard } from '@/components/reports/SimpleKPICard';
import { DataTable } from '@/components/reports/DataTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { 
  useMedicineSalesKPIs, 
  useMedicineSalesByDay, 
  useTopMedicinesByRevenue,
  useMedicineSalesByStore 
} from '@/hooks/analytics-hooks';
import { useState } from 'react';

interface MedicineSalesReportProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
}

export function MedicineSalesReport({ dateRange, onDateRangeChange }: MedicineSalesReportProps) {
  const [activeView, setActiveView] = useState<'day' | 'medicines' | 'store'>('day');

  const { data: kpiData, isLoading: kpiLoading } = useMedicineSalesKPIs(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: dayData, isLoading: dayLoading } = useMedicineSalesByDay(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: topMedicines, isLoading: medicinesLoading } = useTopMedicinesByRevenue(
    dateRange.startDate,
    dateRange.endDate,
    20
  );

  const { data: storeData, isLoading: storeLoading } = useMedicineSalesByStore(
    dateRange.startDate,
    dateRange.endDate
  );

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onDateRangeChange({ ...dateRange, [field]: value });
  };

  const dayColumns = [
    { header: 'Date', accessor: 'sale_date' as const },
    { header: 'Orders', accessor: 'orders' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'AOV', accessor: 'aov' as const, format: 'currency' as const },
  ];

  const medicineColumns = [
    { header: 'Medicine', accessor: 'medicine_name' as const },
    { header: 'Revenue', accessor: 'total_revenue' as const, format: 'currency' as const },
    { header: 'Units Sold', accessor: 'units_sold' as const },
    { header: 'Orders', accessor: 'orders_count' as const },
    { header: 'Avg Price', accessor: 'avg_price' as const, format: 'currency' as const },
  ];

  const storeColumns = [
    { header: 'Store', accessor: 'store_name' as const },
    { header: 'Orders', accessor: 'orders' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'AOV', accessor: 'aov' as const, format: 'currency' as const },
    { header: 'Top Medicine', accessor: 'top_medicine' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <SimpleKPICard
          title="GMV"
          value={`₹${(kpiData?.gmv || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Total Orders"
          value={kpiData?.total_orders || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="AOV"
          value={`₹${(kpiData?.aov || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Prepaid Orders"
          value={kpiData?.prepaid_orders || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="COD Orders"
          value={kpiData?.cod_orders || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Prepaid GMV"
          value={`₹${(kpiData?.prepaid_gmv || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="COD GMV"
          value={`₹${(kpiData?.cod_gmv || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
      </div>

      {/* Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medicine Sales Data</CardTitle>
              <CardDescription>
                Detailed breakdown of medicine sales performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md bg-muted p-1">
                <Button
                  variant={activeView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('day')}
                >
                  Sales by Day
                </Button>
                <Button
                  variant={activeView === 'medicines' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('medicines')}
                >
                  Top Medicines
                </Button>
                <Button
                  variant={activeView === 'store' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('store')}
                >
                  By Store
                </Button>
              </div>
              <ExportButton
                data={activeView === 'day' ? dayData : activeView === 'medicines' ? topMedicines : storeData}
                filename={`medicine-sales-${activeView}-${dateRange.startDate}-to-${dateRange.endDate}`}
                columns={activeView === 'day' ? dayColumns : activeView === 'medicines' ? medicineColumns : storeColumns}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeView === 'day' ? (
            <DataTable
              data={dayData || []}
              columns={dayColumns}
              isLoading={dayLoading}
            />
          ) : activeView === 'medicines' ? (
            <DataTable
              data={topMedicines || []}
              columns={medicineColumns}
              isLoading={medicinesLoading}
            />
          ) : (
            <DataTable
              data={storeData || []}
              columns={storeColumns}
              isLoading={storeLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}