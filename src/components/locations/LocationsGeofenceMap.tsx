import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, Circle, DrawingManager, Autocomplete, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AreaSearchBar } from '../geofencing/AreaSearchBar';
import { 
  MapPin, 
  Palette, 
  Clock, 
  DollarSign, 
  Calendar,
  Save,
  Trash2,
  Power,
  Search,
  Target,
  Edit,
  Plus
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 120px)',
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

// Enhanced geofence interface
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

// Working hours type
interface WorkingHours {
  [key: string]: { start: string; end: string; enabled: boolean }[];
}

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const defaultWorkingHours: WorkingHours = {
  Monday: [{ start: '09:00', end: '18:00', enabled: true }],
  Tuesday: [{ start: '09:00', end: '18:00', enabled: true }],
  Wednesday: [{ start: '09:00', end: '18:00', enabled: true }],
  Thursday: [{ start: '09:00', end: '18:00', enabled: true }],
  Friday: [{ start: '09:00', end: '18:00', enabled: true }],
  Saturday: [{ start: '09:00', end: '18:00', enabled: true }],
  Sunday: [{ start: '09:00', end: '18:00', enabled: false }],
};

interface LocationsGeofenceMapProps {
  serviceType: 'delivery' | 'lab_collection';
  selectedCenter: string;
  geofences: EnhancedGeofence[];
  selectedGeofence: EnhancedGeofence | null;
  onGeofenceSelect: (geofence: EnhancedGeofence | null) => void;
  onGeofenceCreate: (data: any) => void;
  onGeofenceUpdate: (id: string, data: any) => void;
  onGeofenceDelete: (id: string) => void;
  testPoint: { lat: number; lng: number } | null;
  onTestPointChange: (point: { lat: number; lng: number } | null) => void;
}

export function LocationsGeofenceMap({
  serviceType,
  selectedCenter,
  geofences,
  selectedGeofence,
  onGeofenceSelect,
  onGeofenceCreate,
  onGeofenceUpdate,
  onGeofenceDelete,
  testPoint,
  onTestPointChange
}: LocationsGeofenceMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState<Map<string, google.maps.Polygon | google.maps.Circle>>(new Map());
  
  const { toast } = useToast();

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
  }, []);

  // Handle polygon completion
  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const vertexCount = path.getLength();
    
    // Check vertex limit
    if (vertexCount > 100) {
      toast({
        title: "Too many vertices",
        description: `Polygon has ${vertexCount} vertices. Maximum 100 allowed. Consider simplifying the shape.`,
        variant: "destructive",
      });
      polygon.setMap(null);
      return;
    }

    // Convert to coordinates
    const coordinates: google.maps.LatLng[] = [];
    path.forEach((latLng: google.maps.LatLng) => {
      coordinates.push(latLng);
    });

    // Create GeoJSON
    const geoJsonPolygon = {
      type: 'Polygon',
      coordinates: [[
        ...coordinates.map(coord => [coord.lng(), coord.lat()]),
        [coordinates[0].lng(), coordinates[0].lat()]
      ]]
    };

    // Calculate area (approximate)
    const area = google.maps.geometry.spherical.computeArea(path) / 1000000; // km²

    onGeofenceCreate({
      shape_type: 'polygon',
      polygon_coordinates: geoJsonPolygon,
      area_km2: Math.round(area * 1000) / 1000,
    });

    polygon.setMap(null);
    setIsDrawing(false);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [onGeofenceCreate, drawingManager, toast]);

  // Handle circle completion
  const onCircleComplete = useCallback((circle: google.maps.Circle) => {
    const center = circle.getCenter();
    const radius = circle.getRadius();
    
    if (!center) return;

    // Create circle data
    const circleData = {
      type: 'Circle',
      center: [center.lng(), center.lat()],
      radius: radius
    };

    const area = Math.PI * Math.pow(radius / 1000, 2); // km²

    onGeofenceCreate({
      shape_type: 'circle',
      polygon_coordinates: circleData,
      radius_meters: Math.round(radius),
      area_km2: Math.round(area * 1000) / 1000,
    });

    circle.setMap(null);
    setIsDrawing(false);
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [onGeofenceCreate, drawingManager]);

  // Drawing manager events
  useEffect(() => {
    if (drawingManager) {
      const polygonListener = drawingManager.addListener('polygoncomplete', onPolygonComplete);
      const circleListener = drawingManager.addListener('circlecomplete', onCircleComplete);

      return () => {
        google.maps.event.removeListener(polygonListener);
        google.maps.event.removeListener(circleListener);
      };
    }
  }, [drawingManager, onPolygonComplete, onCircleComplete]);

  // Render geofences on map
  useEffect(() => {
    if (!map) return;

    // Clear existing shapes
    shapes.forEach(shape => shape.setMap(null));
    const newShapes = new Map();

    geofences.forEach(geofence => {
      if (geofence.shape_type === 'polygon') {
        const coordinates = geofence.polygon_coordinates.coordinates[0].map(
          (coord: [number, number]) => ({ lat: coord[1], lng: coord[0] })
        );

        const polygon = new google.maps.Polygon({
          paths: coordinates,
          fillColor: geofence.color || '#4285F4',
          fillOpacity: geofence.is_active ? 0.3 : 0.1,
          strokeColor: geofence.color || '#4285F4',
          strokeOpacity: geofence.is_active ? 0.8 : 0.4,
          strokeWeight: selectedGeofence?.id === geofence.id ? 3 : 2,
          clickable: true,
        });

        polygon.addListener('click', () => {
          onGeofenceSelect(geofence);
        });

        polygon.setMap(map);
        newShapes.set(geofence.id, polygon);
      } else if (geofence.shape_type === 'circle') {
        const center = {
          lat: geofence.polygon_coordinates.center[1],
          lng: geofence.polygon_coordinates.center[0]
        };

        const circle = new google.maps.Circle({
          center,
          radius: geofence.radius_meters || 0,
          fillColor: geofence.color || '#4285F4',
          fillOpacity: geofence.is_active ? 0.3 : 0.1,
          strokeColor: geofence.color || '#4285F4',
          strokeOpacity: geofence.is_active ? 0.8 : 0.4,
          strokeWeight: selectedGeofence?.id === geofence.id ? 3 : 2,
          clickable: true,
        });

        circle.addListener('click', () => {
          onGeofenceSelect(geofence);
        });

        circle.setMap(map);
        newShapes.set(geofence.id, circle);
      }
    });

    setShapes(newShapes);
  }, [map, geofences, selectedGeofence, onGeofenceSelect]);

  // Map click handler for test points
  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (!isDrawing && event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      onTestPointChange({ lat, lng });
    }
  }, [isDrawing, onTestPointChange]);

  // Zoom to geofence
  const zoomToGeofence = useCallback((geofence: EnhancedGeofence) => {
    if (!map) return;

    if (geofence.shape_type === 'polygon') {
      const bounds = new google.maps.LatLngBounds();
      geofence.polygon_coordinates.coordinates[0].forEach((coord: [number, number]) => {
        bounds.extend({ lat: coord[1], lng: coord[0] });
      });
      map.fitBounds(bounds);
    } else if (geofence.shape_type === 'circle') {
      const center = {
        lat: geofence.polygon_coordinates.center[1],
        lng: geofence.polygon_coordinates.center[0]
      };
      map.setCenter(center);
      
      // Calculate appropriate zoom level based on radius
      const radius = geofence.radius_meters || 1000;
      const zoom = Math.max(10, 16 - Math.log2(radius / 100));
      map.setZoom(Math.floor(zoom));
    }
  }, [map]);

  // Auto-zoom when geofence is selected
  useEffect(() => {
    if (selectedGeofence) {
      zoomToGeofence(selectedGeofence);
    }
  }, [selectedGeofence, zoomToGeofence]);

  const startDrawing = (type: 'polygon' | 'circle') => {
    if (drawingManager) {
      setIsDrawing(true);
      const drawingMode = type === 'polygon' 
        ? google.maps.drawing.OverlayType.POLYGON 
        : google.maps.drawing.OverlayType.CIRCLE;
      drawingManager.setDrawingMode(drawingMode);
    }
  };

  const stopDrawing = () => {
    if (drawingManager) {
      setIsDrawing(false);
      drawingManager.setDrawingMode(null);
    }
  };

  return (
    <div className="relative h-full">
      {/* Search Bar */}
      <div className="absolute top-4 right-4 z-10 w-80">
        <AreaSearchBar
          onLocationSelect={handleLocationSelect}
          placeholder="Search area to zoom map..."
        />
      </div>

      {/* Drawing Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          onClick={() => startDrawing('polygon')}
          disabled={isDrawing}
          variant="secondary"
          size="sm"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Draw Polygon
        </Button>
        <Button
          onClick={() => startDrawing('circle')}
          disabled={isDrawing}
          variant="secondary"
          size="sm"
        >
          <Target className="h-4 w-4 mr-2" />
          Draw Circle
        </Button>
        {isDrawing && (
          <Button
            onClick={stopDrawing}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        onLoad={onMapLoad}
        onClick={onMapClick}
      >
        <DrawingManager
          onLoad={onDrawingManagerLoad}
          options={{
            drawingControl: false,
            polygonOptions: {
              fillColor: '#4285F4',
              fillOpacity: 0.3,
              strokeColor: '#4285F4',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
              draggable: false,
              editable: true,
              geodesic: false,
            },
            circleOptions: {
              fillColor: '#4285F4',
              fillOpacity: 0.3,
              strokeColor: '#4285F4',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false,
              draggable: true,
              editable: true,
            },
          }}
        />
        
        {/* Test Point Marker */}
        {testPoint && (
          <Marker
            position={testPoint}
            icon={{
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#FF4444" stroke="#FFFFFF" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="#FFFFFF"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
            }}
            title="Test Point"
          />
        )}
      </GoogleMap>
    </div>
  );
}