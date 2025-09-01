import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCreateGeofence } from '@/hooks/geofencing-hooks';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Zap, Plus, CheckCircle } from 'lucide-react';

// Predefined Imphal area coordinates for quick setup
const IMPHAL_AREAS = {
  'imphal-center': {
    name: 'Imphal Center',
    coordinates: [
      { lat: 24.8170, lng: 93.9368 },
      { lat: 24.8200, lng: 93.9450 },
      { lat: 24.8100, lng: 93.9500 },
      { lat: 24.8050, lng: 93.9400 },
      { lat: 24.8120, lng: 93.9320 }
    ]
  },
  'imphal-west': {
    name: 'Imphal West Area',
    coordinates: [
      { lat: 24.8000, lng: 93.9200 },
      { lat: 24.8100, lng: 93.9300 },
      { lat: 24.7950, lng: 93.9350 },
      { lat: 24.7900, lng: 93.9250 }
    ]
  },
  'imphal-east': {
    name: 'Imphal East Area',
    coordinates: [
      { lat: 24.8150, lng: 93.9500 },
      { lat: 24.8250, lng: 93.9600 },
      { lat: 24.8200, lng: 93.9650 },
      { lat: 24.8100, lng: 93.9550 }
    ]
  }
};

interface ImphalGeofenceSetupProps {
  onSetupComplete?: () => void;
}

export function ImphalGeofenceSetup({ onSetupComplete }: ImphalGeofenceSetupProps) {
  const [setupStatus, setSetupStatus] = useState<'pending' | 'setting-up' | 'completed'>('pending');
  const [currentArea, setCurrentArea] = useState<string | null>(null);
  const createGeofence = useCreateGeofence();
  const { toast } = useToast();

  const createGeofenceForArea = async (areaKey: string, serviceType: 'delivery' | 'lab_collection') => {
    const area = IMPHAL_AREAS[areaKey as keyof typeof IMPHAL_AREAS];
    if (!area) return;

    setCurrentArea(`${area.name} - ${serviceType}`);

    // Convert coordinates to GeoJSON polygon
    const coordinates = [...area.coordinates, area.coordinates[0]]; // Close the polygon
    const geoJsonPolygon = {
      type: 'Polygon',
      coordinates: [coordinates.map(coord => [coord.lng, coord.lat])]
    };

    return new Promise<void>((resolve, reject) => {
      createGeofence.mutate({
        name: `${area.name} - ${serviceType === 'delivery' ? 'Medicine Delivery' : 'Lab Collection'}`,
        service_type: serviceType,
        priority: 10,
        is_active: true,
        polygon: geoJsonPolygon as any,
      }, {
        onSuccess: () => {
          resolve();
        },
        onError: (error) => {
          reject(error);
        }
      });
    });
  };

  const setupImphalGeofences = async () => {
    setSetupStatus('setting-up');
    
    try {
      // Create geofences for each area and service type
      const areas = Object.keys(IMPHAL_AREAS);
      const serviceTypes: ('delivery' | 'lab_collection')[] = ['delivery', 'lab_collection'];
      
      for (const area of areas) {
        for (const serviceType of serviceTypes) {
          await createGeofenceForArea(area, serviceType);
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setSetupStatus('completed');
      setCurrentArea(null);
      
      toast({
        title: "Setup completed",
        description: "Imphal geofences have been created successfully for both medicine delivery and lab collection.",
      });

      onSetupComplete?.();
    } catch (error) {
      console.error('Geofence setup error:', error);
      setSetupStatus('pending');
      setCurrentArea(null);
      
      toast({
        title: "Setup failed",
        description: "Failed to create geofences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Imphal Service Area Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            Quick setup for Imphal service areas. This will create geofences for medicine delivery and lab collection services 
            covering the main areas of Imphal.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Areas to be covered:</h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(IMPHAL_AREAS).map(([key, area]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <span className="text-sm">{area.name}</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Delivery</Badge>
                  <Badge variant="outline" className="text-xs">Lab Collection</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {setupStatus === 'setting-up' && currentArea && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Creating: {currentArea}</span>
          </div>
        )}

        {setupStatus === 'completed' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">Imphal geofences setup completed!</span>
          </div>
        )}

        <Button 
          onClick={setupImphalGeofences}
          disabled={setupStatus === 'setting-up' || setupStatus === 'completed'}
          className="w-full"
        >
          {setupStatus === 'setting-up' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Setting up geofences...
            </>
          ) : setupStatus === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Setup Complete
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Setup Imphal Geofences
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}