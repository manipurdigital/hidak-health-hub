
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Map, 
  ExternalLink, 
  UserCheck, 
  Search, 
  Filter, 
  Calendar,
  Phone,
  Clock,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { WhatsAppShareButton } from '@/components/WhatsAppShareButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface LabBooking {
  id: string;
  patient_name: string;
  booking_date: string;
  status: string;
  center_id?: string;
  total_amount: number;
  patient_phone: string;
  center_name?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_address?: any;
  time_slot?: string;
  test_id?: string;
  diagnostic_centers?: { name: string } | null;
}

interface Geofence {
  id: string;
  name: string;
  polygon_coordinates: any;
  center_id: string;
  service_type: string;
  is_active: boolean;
  center_name?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 28.6139,
  lng: 77.2090
};

export default function AdminLabAssignmentsPage() {
  const [selectedBooking, setSelectedBooking] = useState<LabBooking | null>(null);
  const [showGeofenceOverlay, setShowGeofenceOverlay] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const queryClient = useQueryClient();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry", "drawing"]
  });

  // Fetch lab bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-lab-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select(`
          id,
          patient_name,
          booking_date,
          status,
          center_id,
          total_amount,
          patient_phone,
          time_slot,
          pickup_lat,
          pickup_lng,
          pickup_address,
          test_id,
          diagnostic_centers(name)
        `)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      
      return data.map(booking => ({
        id: booking.id,
        patient_name: booking.patient_name,
        booking_date: booking.booking_date,
        status: booking.status,
        center_id: booking.center_id,
        total_amount: booking.total_amount,
        patient_phone: booking.patient_phone,
        time_slot: booking.time_slot,
        pickup_lat: booking.pickup_lat,
        pickup_lng: booking.pickup_lng,
        pickup_address: booking.pickup_address,
        center_name: booking.diagnostic_centers?.name,
        test_id: booking.test_id,
        diagnostic_centers: booking.diagnostic_centers
      }));
    }
  });

  // Fetch diagnostic centers for assignment
  const { data: diagnosticCenters = [] } = useQuery({
    queryKey: ['diagnostic-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch geofences for overlay (reference only)
  const { data: geofences = [] } = useQuery({
    queryKey: ['lab-geofences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geofences')
        .select(`
          id,
          name,
          polygon_coordinates,
          center_id,
          service_type,
          is_active,
          diagnostic_centers(name)
        `)
        .eq('service_type', 'lab')
        .eq('is_active', true);

      if (error) throw error;
      
      return data.map(geofence => ({
        ...geofence,
        center_name: geofence.diagnostic_centers?.name
      }));
    },
    enabled: showGeofenceOverlay
  });

  // Manual assignment mutation
  const assignMutation = useMutation({
    mutationFn: async ({ bookingId, centerId }: { bookingId: string; centerId: string }) => {
      const { data, error } = await supabase.rpc('assign_lab_booking_admin', {
        p_booking_id: bookingId,
        p_center_id: centerId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Assignment Successful",
        description: "Lab test has been assigned to the selected center"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-bookings'] });
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = booking.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.patient_phone.includes(searchTerm) ||
                           booking.test_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           booking.center_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || booking.status === statusFilter;
      
      const matchesDate = !dateFilter || 
                         new Date(booking.booking_date).toDateString() === new Date(dateFilter).toDateString();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    return filtered.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Timer className="h-4 w-4" />;
      case 'assigned': return <CheckCircle2 className="h-4 w-4" />;
      case 'en_route': return <Timer className="h-4 w-4" />;
      case 'collected': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'assigned': return 'default';
      case 'en_route': return 'secondary';
      case 'collected': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getGeofenceColor = (centerId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const hash = centerId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lab Assignment Management</h1>
          <p className="text-muted-foreground">
            Manage and assign lab bookings to diagnostic centers
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="geofence-overlay"
              checked={showGeofenceOverlay}
              onCheckedChange={setShowGeofenceOverlay}
            />
            <Label htmlFor="geofence-overlay" className="text-sm font-medium">
              Show Service Areas
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-lab-bookings'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'assigned').length}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'collected').length}</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{filteredBookings.filter(b => b.status === 'cancelled').length}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Bookings List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lab Bookings
                <Badge variant="secondary" className="ml-2">
                  {filteredBookings.length}
                </Badge>
              </CardTitle>
            </div>
            
            {/* Enhanced Filters */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, phone, test, or center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || statusFilter || dateFilter 
                    ? "Try adjusting your filters to see more results."
                    : "No lab bookings have been made yet."
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow 
                      key={booking.id}
                      className={`cursor-pointer transition-colors ${
                        selectedBooking?.id === booking.id ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{booking.patient_name}</div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {booking.patient_phone}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                          </div>
                          {booking.time_slot && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {booking.time_slot}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(booking.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(booking.status)}
                          <span className="capitalize">{booking.status}</span>
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {booking.center_name ? (
                            <div className="flex items-center text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {booking.center_name}
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unassigned
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Show on Map
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Assignment Details and Map */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-5 w-5" />
              <span>Assignment Details</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1">
            {selectedBooking ? (
              <div className="space-y-6">
                {/* Enhanced Booking Details */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedBooking.patient_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Booking ID: {selectedBooking.id.slice(0, 8)}...
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(selectedBooking.status)} className="flex items-center gap-1">
                      {getStatusIcon(selectedBooking.status)}
                      <span className="capitalize">{selectedBooking.status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Test</Label>
                      <p className="font-medium">{selectedBooking.test_id || 'Lab Test'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <p className="font-medium">₹{selectedBooking.total_amount}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.booking_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Time</Label>
                      <p className="font-medium">{selectedBooking.time_slot || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                {selectedBooking.pickup_lat && selectedBooking.pickup_lng ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Pickup Location</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const url = `https://maps.google.com/?q=${selectedBooking.pickup_lat},${selectedBooking.pickup_lng}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in Maps
                        </Button>
                        
                        <WhatsAppShareButton
                          bookingData={{
                            id: selectedBooking.id,
                            patient_name: selectedBooking.patient_name,
                            patient_phone: selectedBooking.patient_phone,
                            booking_date: selectedBooking.booking_date,
                            time_slot: selectedBooking.time_slot || '',
                            test_name: selectedBooking.test_id
                          }}
                          pickupLocation={{
                            lat: selectedBooking.pickup_lat,
                            lng: selectedBooking.pickup_lng,
                            address: selectedBooking.pickup_address
                          }}
                          size="sm"
                        />
                      </div>
                    </div>
                    
                    {selectedBooking.pickup_address && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          {(() => {
                            try {
                              const addr = typeof selectedBooking.pickup_address === 'string' 
                                ? JSON.parse(selectedBooking.pickup_address) 
                                : selectedBooking.pickup_address;
                              return [
                                addr.address_line_1,
                                addr.address_line_2,
                                addr.city,
                                addr.state,
                                addr.pincode
                              ].filter(Boolean).join(', ');
                            } catch {
                              return 'Address information available';
                            }
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedBooking.pickup_lat?.toFixed(6)}, {selectedBooking.pickup_lng?.toFixed(6)}
                        </p>
                      </div>
                    )}

                    <DeliveryMap
                      lat={selectedBooking.pickup_lat}
                      lng={selectedBooking.pickup_lng}
                      address={selectedBooking.pickup_address}
                      className="h-40 rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">No location data available</span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                      This booking doesn't have pickup location information.
                    </p>
                  </div>
                )}

                {/* Enhanced Assignment Section */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Center Assignment
                  </h4>
                  
                  {!selectedBooking.center_id ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                          This booking is not assigned to any center
                        </p>
                      </div>
                      <Select 
                        onValueChange={(centerId) => {
                          if (centerId) {
                            assignMutation.mutate({
                              bookingId: selectedBooking.id,
                              centerId
                            });
                          }
                        }}
                        disabled={assignMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select diagnostic center to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {diagnosticCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Assigned to: {selectedBooking.center_name}
                          </span>
                        </div>
                      </div>
                      <Select 
                        value=""
                        onValueChange={(centerId) => {
                          if (centerId && centerId !== selectedBooking.center_id) {
                            assignMutation.mutate({
                              bookingId: selectedBooking.id,
                              centerId
                            });
                          }
                        }}
                        disabled={assignMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Reassign to different center" />
                        </SelectTrigger>
                        <SelectContent>
                          {diagnosticCenters.filter(c => c.id !== selectedBooking.center_id).map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {assignMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing assignment...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <Map className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a booking</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Choose a lab booking from the list to view details and manage assignments.
                </p>
              </div>
            )}

            {/* Google Map */}
            {isLoaded && (
              <div className="mt-6">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={10}
                  options={{
                    styles: [
                      {
                        featureType: "all",
                        elementType: "geometry.fill",
                        stylers: [{ saturation: -10 }]
                      }
                    ]
                  }}
                >
                  {showGeofenceOverlay && geofences.map((geofence) => {
                    const polygonData = geofence.polygon_coordinates as any;
                    const coordinates = polygonData?.coordinates?.[0]?.map((coord: number[]) => ({
                      lat: coord[1],
                      lng: coord[0]
                    }));

                    if (!coordinates) return null;

                    return (
                      <Polygon
                        key={geofence.id}
                        paths={coordinates}
                        options={{
                          fillColor: getGeofenceColor(geofence.center_id),
                          fillOpacity: 0.2,
                          strokeColor: getGeofenceColor(geofence.center_id),
                          strokeOpacity: 0.8,
                          strokeWeight: 2
                        }}
                      />
                    );
                  })}
                </GoogleMap>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
