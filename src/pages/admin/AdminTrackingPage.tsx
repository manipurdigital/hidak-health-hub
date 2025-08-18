import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useAllCourierLocations } from '@/hooks/tracking-hooks';
import { MapPin, Clock, Truck, Package, Users } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

export default function AdminTrackingPage() {
  const [selectedJobType, setSelectedJobType] = useState<'all' | 'lab' | 'delivery'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { isLoaded } = useGoogleMaps();
  
  const { data: courierLocations = [], isLoading } = useAllCourierLocations({
    type: selectedJobType === 'all' ? undefined : selectedJobType,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    if (courierLocations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      courierLocations.forEach((location) => {
        bounds.extend(new google.maps.LatLng(Number(location.lat), Number(location.lng)));
      });
      map.fitBounds(bounds);
    }
  }, [courierLocations]);

  const getMarkerColor = (jobType: string) => {
    return jobType === 'lab' ? '#3B82F6' : '#10B981';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'en_route':
      case 'out_for_delivery':
        return 'default';
      case 'collected':
      case 'delivered':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return 'N/A';
    return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  };

  const formatETA = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    return `${minutes} min`;
  };

  const activeJobs = courierLocations.filter(loc => 
    loc.lab_bookings?.status === 'en_route' || loc.orders?.status === 'out_for_delivery'
  );

  const completedJobs = courierLocations.filter(loc => 
    loc.lab_bookings?.status === 'collected' || loc.orders?.status === 'delivered'
  );

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Tracking</h1>
          <p className="text-muted-foreground">Monitor all courier locations and delivery status</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lab Collections</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courierLocations.filter(loc => loc.lab_bookings).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medicine Deliveries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courierLocations.filter(loc => loc.orders).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedJobType} onValueChange={(value) => setSelectedJobType(value as 'all' | 'lab' | 'delivery')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lab">Lab Collections</SelectItem>
            <SelectItem value="delivery">Medicine Deliveries</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="en_route">En Route</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="collected">Collected</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="list">Courier List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Courier Locations</CardTitle>
              <CardDescription>
                Track all courier movements and delivery progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {courierLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={{
                      lat: Number(location.lat),
                      lng: Number(location.lng),
                    }}
                    icon={{
                      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="8" fill="${getMarkerColor(location.lab_bookings ? 'lab' : 'delivery')}" stroke="white" stroke-width="2"/>
                          <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>
                      `)}`,
                      scaledSize: new google.maps.Size(24, 24),
                    }}
                    title={location.lab_bookings ? 
                      `Lab Collection: ${location.lab_bookings.patient_name}` : 
                      `Delivery: Order #${location.orders?.order_number}`
                    }
                  />
                ))}
              </GoogleMap>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Courier Status List</CardTitle>
              <CardDescription>
                Detailed view of all courier activities and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : courierLocations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active courier locations found
                  </div>
                ) : (
                  courierLocations.map((location) => (
                    <div key={location.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium">
                              {location.lab_bookings ? 
                                `Lab Collection - ${location.lab_bookings.patient_name}` : 
                                `Medicine Delivery - Order #${location.orders?.order_number}`
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {location.lab_bookings ? 
                                `Test: Lab Collection` : 
                                `Order: Medicine Delivery`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(
                            location.lab_bookings?.status || location.orders?.status || ''
                          )}>
                            {location.lab_bookings?.status || location.orders?.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(location.recorded_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p>{Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ETA:</span>
                          <p>N/A</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Distance:</span>
                          <p>N/A</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}