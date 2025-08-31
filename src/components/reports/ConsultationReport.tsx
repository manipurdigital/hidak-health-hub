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
  useConsultationKPIs, 
  useConsultationsByDay, 
  useConsultationsBySpecialty,
  useConsultationsByDoctor 
} from '@/hooks/analytics-placeholders';
import { useState } from 'react';

interface ConsultationReportProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
}

export function ConsultationReport({ dateRange, onDateRangeChange }: ConsultationReportProps) {
  const [activeView, setActiveView] = useState<'day' | 'specialty' | 'doctor'>('day');

  const { data: kpiData, isLoading: kpiLoading } = useConsultationKPIs(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: dayData, isLoading: dayLoading } = useConsultationsByDay(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: specialtyData, isLoading: specialtyLoading } = useConsultationsBySpecialty(
    dateRange.startDate,
    dateRange.endDate
  );

  const { data: doctorData, isLoading: doctorLoading } = useConsultationsByDoctor(
    dateRange.startDate,
    dateRange.endDate
  );

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onDateRangeChange({ ...dateRange, [field]: value });
  };

  const dayColumns = [
    { header: 'Date', accessor: 'consultation_date' as const },
    { header: 'Consultations', accessor: 'consultations' as const },
    { header: 'Completed', accessor: 'completed' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
  ];

  const specialtyColumns = [
    { header: 'Specialty', accessor: 'specialization' as const },
    { header: 'Consultations', accessor: 'consultations' as const },
    { header: 'Completed', accessor: 'completed' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'Avg Fee', accessor: 'avg_fee' as const, format: 'currency' as const },
  ];

  const doctorColumns = [
    { header: 'Doctor', accessor: 'doctor_name' as const },
    { header: 'Specialty', accessor: 'specialization' as const },
    { header: 'Consultations', accessor: 'consultations' as const },
    { header: 'Completed', accessor: 'completed' as const },
    { header: 'Revenue', accessor: 'revenue' as const, format: 'currency' as const },
    { header: 'Avg Fee', accessor: 'avg_fee' as const, format: 'currency' as const },
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <SimpleKPICard
          title="Total Consultations"
          value={kpiData?.total_consultations || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Completed"
          value={kpiData?.completed_consultations || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Completion Rate"
          value={`${kpiData?.completion_rate || 0}%`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Revenue"
          value={`₹${(kpiData?.consultation_revenue || 0).toLocaleString()}`}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Care+ Consultations"
          value={kpiData?.care_plus_consultations || 0}
          isLoading={kpiLoading}
        />
        <SimpleKPICard
          title="Care+ Share"
          value={`${kpiData?.care_plus_share || 0}%`}
          isLoading={kpiLoading}
        />
      </div>

      {/* Tables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consultation Data</CardTitle>
              <CardDescription>
                Detailed breakdown of consultation performance
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
                  variant={activeView === 'specialty' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('specialty')}
                >
                  By Specialty
                </Button>
                <Button
                  variant={activeView === 'doctor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('doctor')}
                >
                  By Doctor
                </Button>
              </div>
              <ExportButton
                data={activeView === 'day' ? (dayData || []) : activeView === 'specialty' ? (specialtyData || []) : (doctorData || [])}
                filename={`consultations-${activeView}-${dateRange.startDate}-to-${dateRange.endDate}`}
                columns={activeView === 'day' ? dayColumns : activeView === 'specialty' ? specialtyColumns : doctorColumns}
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
          ) : activeView === 'specialty' ? (
            <DataTable
              data={specialtyData || []}
              columns={specialtyColumns}
              isLoading={specialtyLoading}
            />
          ) : (
            <DataTable
              data={doctorData || []}
              columns={doctorColumns}
              isLoading={doctorLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}