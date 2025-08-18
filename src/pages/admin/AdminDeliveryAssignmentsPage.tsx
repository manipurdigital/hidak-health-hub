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

interface DeliveryOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  delivery_center_id?: string;
  total_amount: number;
  shipping_address: any;
  store_name?: string;
  assignment_reason?: string;
}

interface Geofence {
  id: string;
  name: string;
  polygon_coordinates: any;
  store_id: string;
  service_type: string;
  is_active: boolean;
  store_name?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 28.6139,
  lng: 77.2090
};

export default function AdminDeliveryAssignmentsPage() {
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showGeofenceOverlay, setShowGeofenceOverlay] = useState(false);
  const queryClient = useQueryClient();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCoS3UexTT-0nRhoyFEoXml7KQtUaCFPMk',
    libraries: ["places", "geometry", "drawing"]
  });

  // Fetch delivery orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-delivery-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          delivery_center_id,
          total_amount,
          shipping_address,
          stores(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(order => ({
        ...order,
        store_name: order.stores?.name
      }));
    }
  });

  // Fetch geofences for overlay
  const { data: geofences = [] } = useQuery({
    queryKey: ['delivery-geofences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('geofences')
        .select(`
          id,
          name,
          polygon_coordinates,
          store_id,
          service_type,
          is_active,
          stores(name)
        `)
        .eq('service_type', 'delivery')
        .eq('is_active', true);

      if (error) throw error;
      
      return data.map(geofence => ({
        ...geofence,
        store_name: geofence.stores?.name
      }));
    },
    enabled: showGeofenceOverlay
  });

  // Re-run auto assignment
  const reassignMutation = useMutation({
    mutationFn: async (order: DeliveryOrder) => {
      // Extract coordinates from shipping address
      const lat = order.shipping_address?.latitude || 28.6139 + (Math.random() - 0.5) * 0.1;
      const lng = order.shipping_address?.longitude || 77.2090 + (Math.random() - 0.5) * 0.1;
      
      const assignment = await pickCenterForJob('delivery', lat, lng);
      
      if (!assignment) {
        throw new Error('No suitable delivery center found');
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_center_id: assignment.center_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;
      
      return { ...assignment, order_id: order.id };
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Updated",
        description: `Order reassigned - ${data.reason.replace('_', ' ')}`
      });
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-orders'] });
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
      case 'confirmed': return 'default';
      case 'packed': return 'default';
      case 'out_for_delivery': return 'secondary';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getGeofenceColor = (storeId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const hash = storeId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getAddressString = (address: any) => {
    if (!address) return 'No address';
    return `${address.address_line_1 || ''}, ${address.city || ''}, ${address.postal_code || ''}`.trim().replace(/^,|,$/, '');
  };

  if (isLoading) {
    return <div className="p-6">Loading delivery assignments...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Assignments</h1>
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
        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order.id}
                    className={selectedOrder?.id === order.id ? "bg-muted" : ""}
                  >
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.store_name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reassignMutation.mutate(order)}
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
            {selectedOrder && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <h3 className="font-medium">Order #{selectedOrder.order_number}</h3>
                <p className="text-sm text-muted-foreground">
                  Address: {getAddressString(selectedOrder.shipping_address)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assignment: {selectedOrder.store_name ? "Inside geofence" : "Fallback"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => reassignMutation.mutate(selectedOrder)}
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
                        fillColor: getGeofenceColor(geofence.store_id),
                        fillOpacity: 0.2,
                        strokeColor: getGeofenceColor(geofence.store_id),
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