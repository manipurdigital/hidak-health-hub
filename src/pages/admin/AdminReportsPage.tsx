import React, { useState } from 'react';
import { subDays, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LabCollectionsReport } from '@/components/reports/LabCollectionsReport';
import { MedicineSalesReport } from '@/components/reports/MedicineSalesReport';
import { ConsultationReport } from '@/components/reports/ConsultationReport';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Track performance across lab collections, medicine sales, and consultations
        </p>
      </div>

      <Tabs defaultValue="lab-collections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lab-collections">Lab Collections</TabsTrigger>
          <TabsTrigger value="medicine-sales">Medicine Sales</TabsTrigger>
          <TabsTrigger value="consultations">Doctor Consultations</TabsTrigger>
        </TabsList>

        <TabsContent value="lab-collections" className="space-y-6">
          <LabCollectionsReport 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>

        <TabsContent value="medicine-sales" className="space-y-6">
          <MedicineSalesReport 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>

        <TabsContent value="consultations" className="space-y-6">
          <ConsultationReport 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}