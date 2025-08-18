import React, { useState } from 'react';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { CenterSelectorPanel } from '@/components/locations/CenterSelectorPanel';
import { LocationsGeofenceMap } from '@/components/locations/LocationsGeofenceMap';
import { GeofenceFormPanel } from '@/components/locations/GeofenceFormPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGeofences, useCentersAndStores, useCreateGeofence, useUpdateGeofence, useDeleteGeofence } from '@/hooks/geofencing-hooks';
import { CheckCircle, XCircle, MapPin } from 'lucide-react';

interface EnhancedGeofence {
  id: string;
  name: string;
  color?: string;
  service_type: 'delivery' | 'lab_collection';
  shape_type?: 'polygon' | 'circle';
  polygon_coordinates?: any;
  area_km2?: number | null;
  radius_meters?: number | null;
  is_active: boolean;
  priority?: number;
  capacity_per_day?: number | null;
  min_order_value?: number | null;
  working_hours?: any;
  notes?: string | null;
  center_id?: string | null;
  store_id?: string | null;
  center_name?: string;
  store_name?: string;
}

export default function AdminLocationsPage() {
  const [serviceType, setServiceType] = useState<'delivery' | 'lab_collection'>('delivery');
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [selectedGeofence, setSelectedGeofence] = useState<EnhancedGeofence | null>(null);
  const [testPoint, setTestPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const { data: geofences = [], refetch: refetchGeofences } = useGeofences();
  const { data: centersAndStores } = useCentersAndStores();
  const createGeofence = useCreateGeofence();
  const updateGeofence = useUpdateGeofence();
  const deleteGeofence = useDeleteGeofence();

  // Filter geofences based on current selection
  const filteredGeofences = geofences.filter(g => g.service_type === serviceType) as EnhancedGeofence[];

  const handleServiceTypeChange = (type: 'delivery' | 'lab_collection') => {
    setServiceType(type);
    setSelectedCenter('all');
    setSelectedGeofence(null);
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setTestPoint({ lat, lng });
      
      // Test serviceability for this point
      testServiceability(lat, lng);
    }
  };

  const testServiceability = async (lat: number, lng: number) => {
    // Simple client-side test - check if point is in any active geofence
    const results = filteredGeofences
      .filter(g => g.is_active)
      .map(geofence => {
        let isInside = false;
        
        if (geofence.shape_type === 'polygon') {
          // Use Google Maps geometry library to test if point is in polygon
          const polygon = new google.maps.Polygon({
            paths: geofence.polygon_coordinates.coordinates[0].map(
              (coord: [number, number]) => ({ lat: coord[1], lng: coord[0] })
            )
          });
          isInside = google.maps.geometry.poly.containsLocation(
            new google.maps.LatLng(lat, lng),
            polygon
          );
        } else if (geofence.shape_type === 'circle') {
          const center = new google.maps.LatLng(
            geofence.polygon_coordinates.center[1],
            geofence.polygon_coordinates.center[0]
          );
          const point = new google.maps.LatLng(lat, lng);
          const distance = google.maps.geometry.spherical.computeDistanceBetween(center, point);
          isInside = distance <= (geofence.radius_meters || 0);
        }
        
        return {
          geofence,
          isServiceable: isInside,
          reason: isInside ? 'Within service area' : 'Outside service area'
        };
      });
    
    setTestResults(results);
  };

  const handleGeofenceCreate = async (data: any) => {
    try {
      const createData = {
        name: `New ${serviceType === 'delivery' ? 'Delivery' : 'Lab'} Area`,
        service_type: serviceType,
        center_id: serviceType === 'lab_collection' && selectedCenter !== 'all' ? selectedCenter : undefined,
        store_id: serviceType === 'delivery' && selectedCenter !== 'all' ? selectedCenter : undefined,
        ...data,
      };
      
      await createGeofence.mutateAsync(createData);
      refetchGeofences();
    } catch (error) {
      console.error('Error creating geofence:', error);
    }
  };

  const handleGeofenceUpdate = async (id: string, data: any) => {
    try {
      await updateGeofence.mutateAsync({ id, data });
      refetchGeofences();
      
      // Update selected geofence
      const updatedGeofence = geofences.find(g => g.id === id);
      if (updatedGeofence) {
        setSelectedGeofence(updatedGeofence as EnhancedGeofence);
      }
    } catch (error) {
      console.error('Error updating geofence:', error);
    }
  };

  const handleGeofenceDelete = async (id: string) => {
    try {
      await deleteGeofence.mutateAsync(id);
      refetchGeofences();
      setSelectedGeofence(null);
    } catch (error) {
      console.error('Error deleting geofence:', error);
    }
  };

  const handleGeofenceDeactivate = async (id: string) => {
    const geofence = geofences.find(g => g.id === id);
    if (geofence) {
      await handleGeofenceUpdate(id, { is_active: !geofence.is_active });
    }
  };

  return (
    <GoogleMapsProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Location Management</h1>
          <p className="text-muted-foreground">
            Create and manage service area geofences for pharmacies and diagnostic centers
          </p>
        </div>

        {/* Three Panel Layout */}
        <div className="grid grid-cols-12 gap-6 h-screen max-h-[calc(100vh-200px)]">
          {/* Left Panel - Center Selector & Geofence List */}
          <div className="col-span-3">
            <CenterSelectorPanel
              serviceType={serviceType}
              onServiceTypeChange={handleServiceTypeChange}
              selectedCenter={selectedCenter}
              onCenterChange={setSelectedCenter}
              centers={centersAndStores?.centers || []}
              stores={centersAndStores?.stores || []}
              geofences={filteredGeofences}
              selectedGeofence={selectedGeofence}
              onGeofenceSelect={(geofence) => setSelectedGeofence(geofence)}
              onPlaceSelect={handlePlaceSelect}
            />
          </div>

          {/* Center Panel - Map */}
          <div className="col-span-6">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <LocationsGeofenceMap
                  serviceType={serviceType}
                  selectedCenter={selectedCenter}
                  geofences={filteredGeofences}
                  selectedGeofence={selectedGeofence}
                  onGeofenceSelect={(geofence) => setSelectedGeofence(geofence)}
                  onGeofenceCreate={handleGeofenceCreate}
                  onGeofenceUpdate={handleGeofenceUpdate}
                  onGeofenceDelete={handleGeofenceDelete}
                  testPoint={testPoint}
                  onTestPointChange={setTestPoint}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Geofence Form */}
          <div className="col-span-3">
            <div className="space-y-4 h-full">
              <GeofenceFormPanel
                selectedGeofence={selectedGeofence}
                onUpdate={handleGeofenceUpdate}
                onDelete={handleGeofenceDelete}
                onDeactivate={handleGeofenceDeactivate}
              />
              
              {/* Test Results */}
              {testPoint && testResults.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">Serviceability Test</span>
                      </div>
                      
                      <div className="space-y-2">
                        {testResults.map((result, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate">{result.geofence.name}</span>
                            <Badge variant={result.isServiceable ? "default" : "destructive"}>
                              {result.isServiceable ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {result.isServiceable ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      {testResults.some(r => r.isServiceable) ? (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ Location is serviceable
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 font-medium">
                          ✗ Location is not serviceable
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTestPoint(null);
                          setTestResults([]);
                        }}
                      >
                        Clear Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </GoogleMapsProvider>
  );
}