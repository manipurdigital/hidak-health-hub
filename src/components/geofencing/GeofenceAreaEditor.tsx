import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, DrawingManager, Polygon } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { latLngsToGeoJSONPolygon } from '@/utils/geo';
import { Map, Save, RotateCcw } from 'lucide-react';

interface GeofenceAreaEditorProps {
  currentPolygon: any; // GeoJSON polygon
  onPolygonChange: (newPolygon: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 24.8175,
  lng: 93.9368,
};

export function GeofenceAreaEditor({ 
  currentPolygon, 
  onPolygonChange, 
  onSave, 
  onCancel 
}: GeofenceAreaEditorProps) {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Convert GeoJSON to Google Maps LatLng format
  const convertGeoJSONToLatLng = useCallback((geoJson: any) => {
    if (!geoJson?.coordinates?.[0]) return [];
    return geoJson.coordinates[0].map((coord: [number, number]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  }, []);

  const polygonPath = convertGeoJSONToLatLng(currentPolygon);

  useEffect(() => {
    if (map && polygonPath.length > 0) {
      // Fit map to show the polygon
      const bounds = new google.maps.LatLngBounds();
      polygonPath.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
    }
  }, [map, polygonPath]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    setDrawingManager(drawingManager);
  }, []);

  const onPolygonComplete = useCallback((newPolygon: google.maps.Polygon) => {
    // Remove the old polygon
    if (polygon) {
      polygon.setMap(null);
    }

    // Disable drawing
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }

    setPolygon(newPolygon);
    setHasChanges(true);

    // Convert to our format and notify parent
    const path = newPolygon.getPath();
    const coordinates = path.getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));

    try {
      const geoJsonPolygon = latLngsToGeoJSONPolygon(coordinates);
      onPolygonChange(geoJsonPolygon);
    } catch (error) {
      console.error('Error converting polygon:', error);
    }
  }, [polygon, drawingManager, onPolygonChange]);

  const startDrawing = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const resetToOriginal = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setHasChanges(false);
    onPolygonChange(currentPolygon);
  };

  const handleSave = () => {
    setHasChanges(false);
    onSave();
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading map...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Edit Geofence Area
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={startDrawing} variant="outline" size="sm">
            <Map className="h-4 w-4 mr-2" />
            Redraw Area
          </Button>
          <Button onClick={resetToOriginal} variant="outline" size="sm" disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Original
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              You have unsaved changes to the geofence area. Draw a new polygon or reset to continue.
            </p>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={13}
            onLoad={onLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: false,
              zoomControl: true,
            }}
          >
            <DrawingManager
              onLoad={onDrawingManagerLoad}
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: false,
                polygonOptions: {
                  fillColor: '#4285F4',
                  fillOpacity: 0.3,
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  editable: true,
                  draggable: false,
                },
              }}
            />

            {/* Show current polygon if no new one is drawn */}
            {!polygon && polygonPath.length > 0 && (
              <Polygon
                paths={[polygonPath]}
                options={{
                  fillColor: '#22c55e',
                  fillOpacity: 0.3,
                  strokeColor: '#22c55e',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
            )}
          </GoogleMap>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Update Area
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}