import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { SimpleKPICard } from '@/components/reports/SimpleKPICard';
import { DataTable } from '@/components/reports/DataTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { 
  useLabCollectionsKPIs, 
  useLabCollectionsByDay, 
  useLabCollectionsByCenter,
  useLabTests 
} from '@/hooks/analytics-placeholders';

interface LabCollectionsReportProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
}

export function LabCollectionsReport({ dateRange, onDateRangeChange }: LabCollectionsReportProps) {
  const [filters, setFilters] = useState({
    center: '',
    city: '',
    pincode: '',
    testId: '',
  });

  const [activeView, setActiveView] = useState<'day' | 'center'>('day');

  const { data: kpiData, isLoading: kpiLoading } = useLabCollectionsKPIs(
    dateRange.startDate,
    dateRange.endDate,
    filters
  );

  const { data: dayData, isLoading: dayLoading } = useLabCollectionsByDay(
    dateRange.startDate,
    dateRange.endDate,
    filters
  );

  const { data: centerData, isLoading: centerLoading } = useLabCollectionsByCenter(
    dateRange.startDate,
    dateRange.endDate,
    filters
  );

  const { data: labTests } = useLabTests();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onDateRangeChange({ ...dateRange, [field]: value });
  };

  const clearFilters = () => {
    setFilters({
      center: '',
      city: '',
      pincode: '',
      testId: '',
    });
  };

  const dayColumns = [
    { header: 'Date', accessor: 'collection_date' as const },
    { header: 'Bookings', accessor: 'bookings' as const },
    { header: 'Collected', accessor: 'collected' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'Center Payouts', accessor: 'payouts' as const, format: 'currency' as const },
  ];

  const centerColumns = [
    { header: 'Center', accessor: 'center_name' as const },
    { header: 'Bookings', accessor: 'bookings' as const },
    { header: 'Collected', accessor: 'collected' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'Payouts', accessor: 'payouts' as const, format: 'currency' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="center">Center</Label>
              <Input
                id="center"
                placeholder="Filter by center"
                value={filters.center}
                onChange={(e) => handleFilterChange('center', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Filter by city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                placeholder="Filter by pincode"
                value={filters.pincode}
                onChange={(e) => handleFilterChange('pincode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test">Test</Label>
              <Select value={filters.testId} onValueChange={(value) => handleFilterChange('testId', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tests</SelectItem>
                  {labTests?.map((test) => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SimpleKPICard
          title="Total Bookings"
          value={kpiData?.total_bookings || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Collected"
          value={kpiData?.collected_bookings || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Collection Rate"
          value={`${kpiData?.collection_rate || 0}%`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Lab Revenue"
          value={`₹${(kpiData?.lab_revenue || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Center Payouts"
          value={`₹${(kpiData?.center_payouts || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
      </div>

      {/* Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lab Collections Data</CardTitle>
              <CardDescription>
                Detailed breakdown of lab collections and center performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md bg-muted p-1">
                <Button
                  variant={activeView === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('day')}
                >
                  By Day
                </Button>
                <Button
                  variant={activeView === 'center' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('center')}
                >
                  By Center
                </Button>
              </div>
              <ExportButton
                data={activeView === 'day' ? dayData : centerData}
                filename={`lab-collections-${activeView}-${dateRange.startDate}-to-${dateRange.endDate}`}
                columns={activeView === 'day' ? dayColumns : centerColumns}
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
          ) : (
            <DataTable
              data={centerData || []}
              columns={centerColumns}
              isLoading={centerLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}