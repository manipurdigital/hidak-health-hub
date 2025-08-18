import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, RefreshCw, Map, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { pickCenterForJob } from '@/services/serviceability';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api';

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
    googleMapsApiKey: 'AIzaSyCoS3UexTT-0nRhoyFEoXml7KQtUaCFPMk',
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
          diagnostic_centers(name)
        `)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      
      return data.map(booking => ({
        ...booking,
        center_name: booking.diagnostic_centers?.name
      }));
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

  // Re-run auto assignment
  const reassignMutation = useMutation({
    mutationFn: async (booking: LabBooking) => {
      // For demo purposes, using a default location
      // In real implementation, you'd get the actual address coordinates
      const lat = 28.6139 + (Math.random() - 0.5) * 0.1;
      const lng = 77.2090 + (Math.random() - 0.5) * 0.1;
      
      const assignment = await pickCenterForJob('lab', lat, lng);
      
      if (!assignment) {
        throw new Error('No suitable center found');
      }

      const { error } = await supabase
        .from('lab_bookings')
        .update({ 
          center_id: assignment.center_id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;
      
      return { ...assignment, booking_id: booking.id };
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Updated",
        description: `Booking reassigned - ${data.reason.replace('_', ' ')}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-bookings'] });
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reassignMutation.mutate(booking)}
                          disabled={reassignMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
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
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <h3 className="font-medium">{selectedBooking.patient_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Assignment: {selectedBooking.center_name ? "Inside geofence" : "Fallback"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => reassignMutation.mutate(selectedBooking)}
                  disabled={reassignMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-run auto-assign
                </Button>
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