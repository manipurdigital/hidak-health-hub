import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, DrawingManager, Polygon } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { latLngsToGeoJSONPolygon } from '@/utils/geo';
import { Map, Save, RotateCcw, Hand, Undo2, Trash2 } from 'lucide-react';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);

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

    // Disable drawing and enable pan mode
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setIsDrawing(false);

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
      setIsDrawing(true);
      setIsPanMode(false);
    }
  };

  const enablePanMode = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setIsDrawing(false);
    setIsPanMode(true);
  };

  const clearAll = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
    setIsDrawing(false);
    setIsPanMode(false);
    setHasChanges(false);
    onPolygonChange(null);
  };

  const deleteLastPoint = () => {
    if (polygon) {
      const path = polygon.getPath();
      if (path.getLength() > 3) { // Keep at least 3 points for a valid polygon
        path.removeAt(path.getLength() - 1);
        
        // Update the polygon coordinates
        const coordinates = path.getArray().map(latLng => ({
          lat: latLng.lat(),
          lng: latLng.lng(),
        }));

        try {
          const geoJsonPolygon = latLngsToGeoJSONPolygon(coordinates);
          onPolygonChange(geoJsonPolygon);
        } catch (error) {
          console.error('Error updating polygon after delete:', error);
        }
      }
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
    setIsDrawing(false);
    setIsPanMode(false);
    setHasChanges(false);
    onPolygonChange(currentPolygon);
  };

  const handleSave = () => {
    setHasChanges(false);
    setIsDrawing(false);
    setIsPanMode(false);
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
        {/* Primary Drawing Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={startDrawing} 
            variant={isDrawing ? "default" : "outline"} 
            size="sm"
          >
            <Map className="h-4 w-4 mr-2" />
            {isDrawing ? 'Drawing...' : 'Draw New Area'}
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

        {/* Drawing Tools (show only when drawing or polygon exists) */}
        {(isDrawing || polygon) && (
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={deleteLastPoint} 
              variant="outline" 
              size="sm" 
              disabled={!polygon}
              title="Delete last point"
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Undo Point
            </Button>
            <Button 
              onClick={clearAll} 
              variant="outline" 
              size="sm"
              title="Clear all and start over"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}

        {/* Reset Control */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={resetToOriginal} variant="outline" size="sm" disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Original
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              You have unsaved changes to the geofence area.
            </p>
          </div>
        )}

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