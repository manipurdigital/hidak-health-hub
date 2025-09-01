import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLayoutWrapper } from "@/components/AdminLayoutWrapper";
import { ManualAssignmentPanel } from "@/components/admin/ManualAssignmentPanel";
import { ServiceAreaGuard } from "@/components/ServiceAreaGuard";
import { useNotifyAdminWhatsApp } from "@/hooks/manual-assignment-hooks";
import { Calendar, User, Phone, Beaker, Clock, TestTube } from "lucide-react";
import { format } from "date-fns";

interface LabBooking {
  id: string;
  patient_name: string;
  patient_phone: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  is_within_service_area?: boolean;
  geofence_validated_at?: string;
  assignment_notes?: string;
  test_id?: string;
  lab_tests?: {
    name: string;
  };
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  assigned: "bg-blue-100 text-blue-800",
  collected: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const bookingStatuses = [
  "pending",
  "assigned",
  "collected",
  "completed"
];

const AdminLabBookingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<LabBooking | null>(null);
  const notifyAdmin = useNotifyAdminWhatsApp();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-lab-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          lab_tests (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LabBooking[];
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { error } = await supabase
        .from('lab_bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-bookings'] });
      toast({
        title: "Status updated",
        description: "Lab booking status has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <AdminLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayoutWrapper>
    );
  }

  return (
    <AdminLayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lab Bookings Management</h1>
            <p className="text-muted-foreground">
              Manage lab home collection bookings and assignments
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Lab Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service Area</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.booking_time}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{booking.patient_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {booking.patient_phone}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {booking.lab_tests?.name || 'Lab Test'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">₹{booking.total_amount}</TableCell>
                    <TableCell>
                      <Select
                        value={booking.status}
                        onValueChange={(status) => updateBookingStatus.mutate({ bookingId: booking.id, status })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue>
                            <Badge className={statusColors[booking.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                              {booking.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {bookingStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                {status}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.is_within_service_area ? "default" : "destructive"}>
                        {booking.is_within_service_area ? "✓ Within Area" : "✗ Outside Area"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => notifyAdmin.mutate({ type: 'new_lab_booking', entityId: booking.id })}
                          disabled={notifyAdmin.isPending}
                        >
                          📱 Notify
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Lab Booking Assignment Panel */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Lab Collection Assignment</h2>
                  <Button variant="ghost" onClick={() => setSelectedBooking(null)}>
                    ✕
                  </Button>
                </div>
                
                {/* Service Area Check for lab collection - using default Imphal coordinates */}
                <ServiceAreaGuard
                  lat={24.817}
                  lng={93.938}
                  serviceType="lab_collection"
                  showWarning={true}
                >
                  <div />
                </ServiceAreaGuard>

                {/* Booking Details */}
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Booking Details</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Date:</strong> {format(new Date(selectedBooking.booking_date), 'MMM dd, yyyy')}</div>
                    <div><strong>Time:</strong> {selectedBooking.booking_time}</div>
                    <div><strong>Patient:</strong> {selectedBooking.patient_name}</div>
                    <div><strong>Phone:</strong> {selectedBooking.patient_phone}</div>
                    <div><strong>Test:</strong> {selectedBooking.lab_tests?.name || 'Lab Test'}</div>
                    <div><strong>Amount:</strong> ₹{selectedBooking.total_amount}</div>
                  </div>
                </div>

                {/* Assignment Panel */}
                <ManualAssignmentPanel
                  type="lab_booking"
                  data={selectedBooking}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-lab-bookings'] });
                    setSelectedBooking(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayoutWrapper>
  );
};

export default AdminLabBookingsPage;