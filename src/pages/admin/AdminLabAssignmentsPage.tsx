import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Map, ExternalLink, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { WhatsAppShareButton } from '@/components/WhatsAppShareButton';
import { LatLngDisplay } from '@/components/LatLngDisplay';

interface LabBooking {
  id: string;
  patient_name: string;
  booking_date: string;
  status: string;
  center_id?: string;
  total_amount: number;
  patient_phone: string;
  center_name?: string;
  assignment_reason?: string;
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

  // Fetch geofences for overlay
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
    return <div className="p-6">Loading lab assignments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lab Assignments</h1>
        <div className="flex items-center space-x-2">
          <Switch
            id="geofence-overlay"
            checked={showGeofenceOverlay}
            onCheckedChange={setShowGeofenceOverlay}
          />
          <Label htmlFor="geofence-overlay">Show Geofences</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Lab Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow 
                    key={booking.id}
                    className={selectedBooking?.id === booking.id ? "bg-muted" : ""}
                  >
                    <TableCell className="font-medium">{booking.patient_name}</TableCell>
                    <TableCell>{new Date(booking.booking_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{booking.center_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Map and Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-5 w-5" />
              <span>Assignment Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBooking && (
              <div className="mb-4 p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedBooking.patient_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Test ID: {selectedBooking.test_id || 'Lab Test'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(selectedBooking.booking_date).toLocaleDateString()}
                    {selectedBooking.time_slot && ` | ${selectedBooking.time_slot}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {selectedBooking.center_name ? `Assigned to ${selectedBooking.center_name}` : "Unassigned"}
                  </p>
                </div>

                {/* Location Information */}
                {selectedBooking.pickup_lat && selectedBooking.pickup_lng ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Pickup Location</h4>
                    
                    <div className="text-xs text-muted-foreground">
                      Coordinates: {selectedBooking.pickup_lat?.toFixed(6)}, {selectedBooking.pickup_lng?.toFixed(6)}
                    </div>
                    
                    {selectedBooking.pickup_address && (
                      <div className="text-sm text-muted-foreground">
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
                      </div>
                    )}

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

                    <DeliveryMap
                      lat={selectedBooking.pickup_lat}
                      lng={selectedBooking.pickup_lng}
                      address={selectedBooking.pickup_address}
                      className="h-32"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 bg-amber-50 rounded border border-amber-200">
                    No pickup location data available for this booking. This booking was created before location tracking was implemented.
                  </div>
                )}

                {/* Assignment Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Manual Assignment</h4>
                  
                  {!selectedBooking.center_id ? (
                    <div className="space-y-3">
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>Assigned to: {selectedBooking.center_name}</span>
                      </div>
                    </div>
                  )}
                  
                    {assignMutation.isPending && (
                      <div className="text-sm text-muted-foreground">
                        Processing assignment...
                      </div>
                    )}
                </div>
              </div>
            )}

            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={10}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}