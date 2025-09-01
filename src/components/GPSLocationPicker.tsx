import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GPSLocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  className?: string;
  disabled?: boolean;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export const GPSLocationPicker = ({ onLocationSelect, className, disabled }: GPSLocationPickerProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const { toast } = useToast();

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser.';
      setError(errorMsg);
      toast({
        title: "Location Error",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position as GeolocationPosition),
          (error) => reject(error),
          options
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Try to get address from coordinates using reverse geocoding
      let address = '';
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            address = data.results[0].formatted_address;
          }
        }
      } catch (reverseGeoError) {
        console.warn('Reverse geocoding failed:', reverseGeoError);
        // Continue without address
      }

      const locationData = { latitude, longitude, address };
      setCurrentLocation(locationData);
      onLocationSelect(locationData);
      
      toast({
        title: "Location Found",
        description: address || `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });

    } catch (error: any) {
      let errorMessage = 'Unable to get your location. ';
      
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage += 'Location access was denied. Please enable location permissions and try again.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage += 'Location information is unavailable. Please try again.';
          break;
        case 3: // TIMEOUT
          errorMessage += 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage += 'An unknown error occurred while getting your location.';
      }
      
      setError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={getCurrentLocation}
        disabled={loading || disabled}
        className="w-full flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {loading ? 'Getting Location...' : 'Use Current Location'}
      </Button>

      {error && (
        <Alert variant="destructive" className="mt-3">
          <MapPin className="w-4 h-4" />
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {currentLocation && !error && (
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-700">Current Location Detected</p>
                {currentLocation.address ? (
                  <p className="text-muted-foreground mt-1">{currentLocation.address}</p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};