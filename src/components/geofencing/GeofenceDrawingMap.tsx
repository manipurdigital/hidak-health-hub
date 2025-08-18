import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, DrawingManager } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateGeofence, useCentersAndStores } from '@/hooks/geofencing-hooks';
import { useToast } from '@/hooks/use-toast';
import { Save, Trash2 } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090, // Delhi, India
};

const drawingOptions = {
  fillColor: '#4285F4',
  fillOpacity: 0.3,
  strokeColor: '#4285F4',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: true,
  geodesic: false,
  zIndex: 1,
};

interface GeofenceDrawingMapProps {
  onGeofenceCreated?: () => void;
}

export function GeofenceDrawingMap({ onGeofenceCreated }: GeofenceDrawingMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Form state
  const [geofenceName, setGeofenceName] = useState('');
  const [serviceType, setServiceType] = useState<'delivery' | 'lab_collection'>('delivery');
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [priority, setPriority] = useState(1);

  const { data: centersAndStores } = useCentersAndStores();
  const createGeofence = useCreateGeofence();
  const { toast } = useToast();
  
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManagerInstance: google.maps.drawing.DrawingManager) => {
    setDrawingManager(drawingManagerInstance);
    drawingManagerRef.current = drawingManagerInstance;
  }, []);

  useEffect(() => {
    if (drawingManager) {
      const listener = drawingManager.addListener('polygoncomplete', (newPolygon: google.maps.Polygon) => {
        // Remove previous polygon if exists
        if (polygon) {
          polygon.setMap(null);
        }
        
        setPolygon(newPolygon);
        setIsDrawing(false);
        
        // Switch back to hand mode after drawing
        drawingManager.setDrawingMode(null);
        
        toast({
          title: "Polygon drawn",
          description: "You can now save this geofence or draw a new one.",
        });
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [drawingManager, polygon, toast]);

  const startDrawing = () => {
    if (drawingManager) {
      setIsDrawing(true);
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const clearPolygon = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    setIsDrawing(false);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  };

  const saveGeofence = async () => {
    if (!polygon || !geofenceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please draw a polygon and enter a name for the geofence.",
        variant: "destructive",
      });
      return;
    }

    if (serviceType === 'lab_collection' && !selectedCenterId) {
      toast({
        title: "Validation Error",
        description: "Please select a diagnostic center for lab collection geofence.",
        variant: "destructive",
      });
      return;
    }

    if (serviceType === 'delivery' && !selectedStoreId) {
      toast({
        title: "Validation Error",
        description: "Please select a store for delivery geofence.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get polygon coordinates
      const path = polygon.getPath();
      const coordinates: google.maps.LatLng[] = [];
      path.forEach((latLng: google.maps.LatLng) => {
        coordinates.push(latLng);
      });

      // Convert to GeoJSON format
      const geoJsonPolygon = {
        type: 'Polygon',
        coordinates: [[
          ...coordinates.map(coord => [coord.lng(), coord.lat()]),
          // Close the polygon by repeating the first coordinate
          [coordinates[0].lng(), coordinates[0].lat()]
        ]]
      };

      await createGeofence.mutateAsync({
        name: geofenceName.trim(),
        service_type: serviceType,
        center_id: serviceType === 'lab_collection' ? selectedCenterId : undefined,
        store_id: serviceType === 'delivery' ? selectedStoreId : undefined,
        polygon_coordinates: geoJsonPolygon,
        priority,
      });

      // Reset form
      setGeofenceName('');
      setSelectedCenterId('');
      setSelectedStoreId('');
      setPriority(1);
      clearPolygon();
      
      onGeofenceCreated?.();
    } catch (error) {
      console.error('Error saving geofence:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Geofence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="geofenceName">Geofence Name</Label>
              <Input
                id="geofenceName"
                value={geofenceName}
                onChange={(e) => setGeofenceName(e.target.value)}
                placeholder="Enter geofence name"
              />
            </div>
            
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={serviceType} onValueChange={(value: 'delivery' | 'lab_collection') => {
                setServiceType(value);
                setSelectedCenterId('');
                setSelectedStoreId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Medicine Delivery</SelectItem>
                  <SelectItem value="lab_collection">Lab Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceType === 'lab_collection' && (
              <div>
                <Label htmlFor="centerId">Diagnostic Center</Label>
                <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diagnostic center" />
                  </SelectTrigger>
                  <SelectContent>
                    {centersAndStores?.centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {serviceType === 'delivery' && (
              <div>
                <Label htmlFor="storeId">Store/Pharmacy</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {centersAndStores?.stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={startDrawing} disabled={isDrawing}>
              {isDrawing ? 'Drawing...' : 'Start Drawing'}
            </Button>
            <Button variant="outline" onClick={clearPolygon} disabled={!polygon}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button 
              onClick={saveGeofence} 
              disabled={!polygon || !geofenceName.trim() || createGeofence.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createGeofence.isPending ? 'Saving...' : 'Save Geofence'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={11}
            onLoad={onMapLoad}
          >
            <DrawingManager
              onLoad={onDrawingManagerLoad}
              options={{
                drawingControl: false,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: drawingOptions,
              }}
            />
          </GoogleMap>
        </CardContent>
      </Card>
    </div>
  );
}