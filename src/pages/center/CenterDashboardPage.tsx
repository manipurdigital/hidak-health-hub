import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  Calendar 
} from 'lucide-react';
import { useCenterBookings } from '@/hooks/center-hooks';

export function CenterDashboardPage() {
  const { data: bookings = [], isLoading } = useCenterBookings();

  // Calculate stats
  const assignedCount = bookings.filter(b => b.status === 'assigned').length;
  const enRouteCount = bookings.filter(b => b.status === 'en_route').length;
  const collectedCount = bookings.filter(b => b.status === 'collected').length;
  const todayCount = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.booking_date === today;
  }).length;

  const stats = [
    {
      title: 'Assigned Today',
      value: assignedCount,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'En Route',
      value: enRouteCount,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Collected Today',
      value: collectedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: "Today's Total",
      value: todayCount,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Center Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your lab booking collections and daily activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : bookings.filter(b => b.status === 'collected').slice(0, 5).length === 0 ? (
              <p className="text-muted-foreground">No recent collections</p>
            ) : (
              bookings
                .filter(b => b.status === 'collected')
                .slice(0, 5)
                .map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Collection completed • {booking.booking_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Collected
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {booking.collected_at ? new Date(booking.collected_at).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}