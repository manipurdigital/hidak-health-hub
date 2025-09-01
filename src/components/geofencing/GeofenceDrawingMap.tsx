import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, DrawingManager } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateGeofence } from '@/hooks/geofencing-hooks';
import { useToast } from '@/hooks/use-toast';
import { Save, Trash2, Hand, X, Map, Maximize2, Minimize2 } from 'lucide-react';
import { latLngsToGeoJSONPolygon, normalizeService } from '@/utils/geo';
import { AreaSearchBar } from './AreaSearchBar';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const maximizedMapStyle = {
  width: '100vw',
  height: '100vh',
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
  const [isPanMode, setIsPanMode] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  
  // Form state
  const [geofenceName, setGeofenceName] = useState('');
  const [serviceType, setServiceType] = useState<'delivery' | 'lab_collection'>('delivery');
  const [priority, setPriority] = useState(5);
  const [isActive, setIsActive] = useState(true);
  
  const { toast } = useToast();
  const createGeofence = useCreateGeofence();
  
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleLocationSelect = useCallback((location: { lat: number; lng: number; address: string }) => {
    if (map) {
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(15);
      toast({
        title: "Location found",
        description: `Zoomed to ${location.address}`,
      });
    }
  }, [map, toast]);

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
        setIsPanMode(true);
        
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
      setIsPanMode(false);
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const enablePanMode = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setIsDrawing(false);
    setIsPanMode(true);
  };

  const deleteLastPoint = () => {
    if (polygon) {
      const path = polygon.getPath();
      if (path.getLength() > 3) { // Keep at least 3 points for a valid polygon
        path.removeAt(path.getLength() - 1);
      }
    }
  };

  const clearPolygon = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    setIsDrawing(false);
    setIsPanMode(false);
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

    // Get polygon coordinates
    const path = polygon.getPath();
    const coordinates: Array<{ lat: number; lng: number }> = [];
    path.forEach((latLng: google.maps.LatLng) => {
      coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
    });

    // Convert to GeoJSON format using utility function
    const geoJsonPolygon = latLngsToGeoJSONPolygon(coordinates);

    createGeofence.mutate({
      name: geofenceName.trim(),
      service_type: normalizeService(serviceType),
      priority,
      is_active: isActive,
      polygon: geoJsonPolygon as any,
    }, {
      onSuccess: () => {
        // Reset form
        setGeofenceName('');
        setPriority(5);
        setIsActive(true);
        setIsPanMode(false);
        clearPolygon();
        
        onGeofenceCreated?.();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Geofence</CardTitle>
          <p className="text-sm text-muted-foreground">
            Draw custom areas for your service zones. You can create multiple geofences for different areas and service types.
          </p>
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
              <Select value={serviceType} onValueChange={(value: 'delivery' | 'lab_collection') => setServiceType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Medicine Delivery</SelectItem>
                  <SelectItem value="lab_collection">Lab Home Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 5)}
                placeholder="Higher number wins when areas overlap"
              />
              <p className="text-xs text-muted-foreground mt-1">Higher values take precedence when areas overlap</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Draw Geofence Area</CardTitle>
            <div className="w-72">
              <AreaSearchBar
                onLocationSelect={handleLocationSelect}
                placeholder="Search area to zoom map..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drawing Tools */}
          <div className="space-y-4">
            {/* Primary Drawing Controls */}
            <div className="flex gap-2 flex-wrap justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={startDrawing} 
                  variant={isDrawing ? "default" : "outline"} 
                  size="sm"
                >
                  <Map className="h-4 w-4 mr-2" />
                  {isDrawing ? 'Drawing...' : 'Draw Area'}
                </Button>
                <Button 
                  onClick={enablePanMode} 
                  variant={isPanMode ? "default" : "outline"} 
                  size="sm"
                >
                  <Hand className="h-4 w-4 mr-2" />
                  Hand Tool
                </Button>
              </div>
              <Button 
                onClick={() => setIsMapMaximized(!isMapMaximized)} 
                variant="outline" 
                size="sm"
                title={isMapMaximized ? "Exit fullscreen" : "Maximize map"}
              >
                {isMapMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Drawing Tools (show only when drawing or polygon exists) */}
            {(isDrawing || polygon) && (
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={deleteLastPoint} 
                  variant="outline" 
                  size="sm" 
                  disabled={!polygon || isDrawing}
                  title="Delete last point"
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete Point
                </Button>
                <Button 
                  onClick={clearPolygon} 
                  variant="outline" 
                  size="sm"
                  title="Clear all and start over"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}

            {/* Status Messages */}
            {isDrawing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Drawing Mode:</strong> Click on the map to add points. Complete the polygon by clicking on the first point.
                </p>
              </div>
            )}

            {isPanMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Pan Mode:</strong> Drag to move around the map.
                </p>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className={`border rounded-lg overflow-hidden ${isMapMaximized ? 'fixed inset-0 z-50 bg-background' : ''}`}>
            {isMapMaximized && (
              <div className="absolute top-4 right-4 z-10">
                <Button 
                  onClick={() => setIsMapMaximized(false)} 
                  variant="outline" 
                  size="sm"
                  className="bg-background/80 backdrop-blur"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </Button>
              </div>
            )}
            <GoogleMap
              mapContainerStyle={isMapMaximized ? maximizedMapStyle : mapContainerStyle}
              center={defaultCenter}
              zoom={11}
              onLoad={onMapLoad}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: false,
                zoomControl: true,
              }}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
