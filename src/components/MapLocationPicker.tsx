import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AreaSearchBar } from '@/components/geofencing/AreaSearchBar';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 28.7041, // Delhi coordinates as default
  lng: 77.1025,
};

interface MapLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number; address?: string };
  title?: string;
}

export const MapLocationPicker = ({ 
  isOpen, 
  onClose, 
  onLocationSelect,
  initialLocation,
  title = "Select Location"
}: MapLocationPickerProps) => {
  const [mapCenter, setMapCenter] = useState(initialLocation || defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(initialLocation || defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || '');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useGoogleMaps();

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!isLoaded || !window.google) return '';
    
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    } finally {
      setIsLoadingAddress(false);
    }
    return '';
  }, [isLoaded]);

  // Handle map click to drop pin
  const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      // Get address for the new location
      const address = await reverseGeocode(lat, lng);
      setSelectedAddress(address);
    }
  }, [reverseGeocode]);

  // Handle marker drag
  const handleMarkerDragEnd = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      // Get address for the new location
      const address = await reverseGeocode(lat, lng);
      setSelectedAddress(address);
    }
  }, [reverseGeocode]);

  // Handle search result selection
  const handleSearchSelect = useCallback((result: { lat: number; lng: number; address: string }) => {
    const newPosition = { lat: result.lat, lng: result.lng };
    setMapCenter(newPosition);
    setMarkerPosition(newPosition);
    setSelectedAddress(result.address);
    
    // Pan map to new location
    if (mapRef.current) {
      mapRef.current.panTo(newPosition);
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const newPosition = { lat, lng };
      
      setMapCenter(newPosition);
      setMarkerPosition(newPosition);
      
      // Get address
      const address = await reverseGeocode(lat, lng);
      setSelectedAddress(address);
      
      // Pan map to current location
      if (mapRef.current) {
        mapRef.current.panTo(newPosition);
      }
      
      toast({
        title: "Location Found",
        description: "Current location set successfully"
      });
      
    } catch (error: any) {
      let message = 'Unable to get current location. ';
      switch (error.code) {
        case 1:
          message += 'Location access denied.';
          break;
        case 2:
          message += 'Location unavailable.';
          break;
        case 3:
          message += 'Request timed out.';
          break;
        default:
          message += 'Unknown error occurred.';
      }
      
      toast({
        title: "Location Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingLocation(false);
    }
  }, [reverseGeocode, toast]);

  // Confirm location selection
  const handleConfirmLocation = useCallback(() => {
    onLocationSelect({
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
      address: selectedAddress
    });
    onClose();
  }, [markerPosition, selectedAddress, onLocationSelect, onClose]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Reset to initial location when dialog opens
  useEffect(() => {
    if (isOpen && initialLocation) {
      setMapCenter(initialLocation);
      setMarkerPosition(initialLocation);
      setSelectedAddress(initialLocation.address || '');
    }
  }, [isOpen, initialLocation]);

  if (loadError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load Google Maps. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isLoaded) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading map...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col h-[calc(90vh-80px)]">
          {/* Search and Controls */}
          <div className="p-4 space-y-3 border-b border-border">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <div className="pl-10">
                <AreaSearchBar
                  onLocationSelect={handleSearchSelect}
                  placeholder="Search for a location..."
                  className="w-full border-input"
                />
              </div>
            </div>

            {/* Current Location Button */}
            <Button
              variant="ghost"
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full justify-start text-left h-auto p-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Navigation className="w-5 h-5 text-primary" />
                )}
                <span className="font-medium">Use Current Location</span>
              </div>
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={15}
              center={mapCenter}
              onClick={handleMapClick}
              onLoad={onMapLoad}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'cooperative',
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }]
                  }
                ]
              }}
            >
              <Marker
                position={markerPosition}
                draggable={true}
                onDragEnd={handleMarkerDragEnd}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="8" fill="hsl(192 100% 45%)" stroke="white" stroke-width="2"/>
                      <circle cx="16" cy="16" r="3" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(32, 32),
                  anchor: new google.maps.Point(16, 16)
                }}
              />
            </GoogleMap>
            
            {/* Map Instructions Overlay */}
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-md">
              <p className="text-sm text-muted-foreground">Tap on map or drag pin to select location</p>
            </div>
          </div>

          {/* Selected Location Display */}
          {selectedAddress && (
            <div className="border-t border-border bg-muted/30">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-success text-sm">Selected Location</p>
                    <p className="text-sm text-foreground mt-1">
                      {isLoadingAddress ? 'Getting address...' : selectedAddress}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmLocation} 
                disabled={!markerPosition || isLoadingAddress}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoadingAddress ? 'Getting Address...' : 'Confirm Location'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};