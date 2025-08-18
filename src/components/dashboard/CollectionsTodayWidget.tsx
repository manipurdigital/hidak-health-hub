import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SimpleKPICard } from '@/components/reports/SimpleKPICard';
import { useLabCollectionsKPIs, useLabCollectionsByCenter } from '@/hooks/analytics-hooks';
import { Eye, MapPin } from 'lucide-react';

export function CollectionsTodayWidget() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const { data: kpiData, isLoading: kpiLoading } = useLabCollectionsKPIs(
    today,
    today,
    {}
  );

  const { data: centerData, isLoading: centerLoading } = useLabCollectionsByCenter(
    today,
    today,
    {}
  );

  const topCenter = centerData && centerData.length > 0 
    ? centerData[0] 
    : { center_name: 'No data', bookings: 0 };

  const handleViewFullReport = () => {
    // Navigate to reports page with today's date and lab collections tab
    navigate('/admin/reports', { 
      state: { 
        activeTab: 'lab-collections',
        dateRange: { startDate: today, endDate: today }
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Collections Today
            </CardTitle>
            <CardDescription>
              Today's lab collection performance overview
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewFullReport}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Full Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SimpleKPICard
            title="Bookings Today"
            value={kpiData?.total_bookings || 0}
            isLoading={kpiLoading}
            compact
          />
          <SimpleKPICard
            title="Collected"
            value={kpiData?.collected_bookings || 0}
            isLoading={kpiLoading}
            compact
          />
          <SimpleKPICard
            title="Revenue Today"
            value={`₹${(kpiData?.lab_revenue || 0).toLocaleString()}`}
            isLoading={kpiLoading}
            compact
          />
          <SimpleKPICard
            title="Top Center"
            value={centerLoading ? 'Loading...' : topCenter.center_name}
            subtitle={centerLoading ? '' : `${topCenter.bookings} jobs`}
            isLoading={centerLoading}
            compact
          />
        </div>
        {kpiData && (
          <div className="text-sm text-muted-foreground">
            Collection Rate: {kpiData.collection_rate}% • 
            Center Payouts: ₹{(kpiData.center_payouts || 0).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}