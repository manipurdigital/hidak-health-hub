// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Upload, Clock, CheckCircle, AlertCircle, Route, DollarSign, TrendingUp, CreditCard, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';
import { FileUpload } from '@/components/FileUpload';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { PaymentBreakdown } from '@/components/dashboard/PaymentBreakdown';
import { useLabCollectionsKPIs, useLabCollectionsByDay } from '@/hooks/analytics-hooks';

interface LabBooking {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  booking_date: string;
  time_slot: string;
  status: string;
  special_instructions: string;
  lab_tests: {
    name: string;
    sample_type: string;
  };
}

export const LabDashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(7); // Default to last 7 days
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range for analytics
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = subDays(new Date(), dateRange).toISOString().split('T')[0];

  // Fetch revenue analytics
  const { data: kpiData, isLoading: kpiLoading } = useLabCollectionsKPIs(startDate, endDate);
  const { data: revenueData, isLoading: revenueLoading } = useLabCollectionsByDay(startDate, endDate);

  // Fetch payment breakdown data
  const { data: paymentBreakdown, isLoading: paymentLoading } = useQuery({
    queryKey: ['lab-payment-breakdown', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select('payment_method, total_amount, status')
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .eq('status', 'collected');

      if (error) throw error;

      // Group by payment method
      const breakdown = data?.reduce((acc: any, booking: any) => {
        const method = booking.payment_method || 'online';
        if (!acc[method]) {
          acc[method] = { category: method, revenue: 0, orders: 0 };
        }
        acc[method].revenue += Number(booking.total_amount || 0);
        acc[method].orders += 1;
        return acc;
      }, {});

      return Object.values(breakdown || {});
    }
  });

  // Fetch today's bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['lab-bookings', selectedDate, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('lab_bookings')
        .select(`
          *,
          lab_tests(name, sample_type)
        `)
        .eq('booking_date', selectedDate)
        .order('time_slot');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data?.map(item => ({
        ...item,
        lab_tests: Array.isArray(item.lab_tests) ? item.lab_tests[0] : item.lab_tests
      })) as unknown as LabBooking[] || [];
    }
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('lab_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
      toast({
        title: "Success",
        description: "Booking status updated"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive"
      });
    }
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ bookingId, newDate, newTime }: { 
      bookingId: string; 
      newDate: string; 
      newTime: string; 
    }) => {
      const { error } = await supabase
        .from('lab_bookings')
        .update({ 
          booking_date: newDate,
          time_slot: newTime,
          status: 'rescheduled'
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-bookings'] });
      toast({
        title: "Success",
        description: "Booking rescheduled successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    updateStatusMutation.mutate({ bookingId, status: newStatus });
  };

  const handleReportUpload = (bookingId: string, reportUrl: string) => {
    // Update booking with report URL and set status to completed
    updateStatusMutation.mutate({ bookingId: bookingId, status: 'completed' });
    setUploadingFor(null);
    toast({
      title: "Report uploaded",
      description: "Lab report has been uploaded successfully"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rescheduled':
        return <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />Rescheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Generate route sheet data
  const routeBookings = bookings.filter(b => 
    b.status === 'confirmed' || b.status === 'in_progress'
  ).sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lab Dashboard</h1>
          <p className="text-muted-foreground">Manage sample collections and reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Route className="h-4 w-4 mr-2" />
                Route Sheet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Daily Route Sheet - {format(new Date(selectedDate), 'MMM dd, yyyy')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {routeBookings.map((booking, index) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{booking.patient_name}</div>
                        <div className="text-sm text-muted-foreground">{booking.time_slot}</div>
                        <div className="text-sm text-muted-foreground">{booking.lab_tests.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{booking.patient_phone}</div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Revenue & Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={kpiData?.lab_revenue || 0}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Collections Today"
          value={kpiData?.collected_bookings || 0}
          format="number"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KPICard
          title="Collection Rate"
          value={kpiData?.collection_rate || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Center Payouts"
          value={kpiData?.center_payouts || 0}
          format="currency"
          icon={<Receipt className="h-4 w-4" />}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={revenueData?.map(item => ({
            date: item.collection_date,
            value: item.revenue
          }))}
          isLoading={revenueLoading}
          title="Revenue Trend"
        />
        <PaymentBreakdown
          data={paymentBreakdown as any}
          isLoading={paymentLoading}
          title="Payment Methods"
        />
      </div>

      {/* Date Range Filter for Analytics */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium">Analytics Period</label>
              <Select value={dateRange.toString()} onValueChange={(value) => setDateRange(Number(value))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Pickups ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.patient_name}</div>
                      <div className="text-sm text-muted-foreground">{booking.patient_phone}</div>
                      <div className="text-sm text-muted-foreground">{booking.patient_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{booking.lab_tests.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Sample: {booking.lab_tests.sample_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {booking.time_slot}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={booking.status}
                        onValueChange={(value) => handleStatusChange(booking.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {booking.status === 'in_progress' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-1" />
                              Upload Report
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upload Lab Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Patient: {booking.patient_name}</h4>
                                <p className="text-sm text-muted-foreground">Test: {booking.lab_tests.name}</p>
                              </div>
                              <FileUpload
                                bucket="lab-reports"
                                allowedTypes={['application/pdf']}
                                maxSizeKB={10240}
                                onUploadComplete={(url, path) => handleReportUpload(booking.id, url)}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};