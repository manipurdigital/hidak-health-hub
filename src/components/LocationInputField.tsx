import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { Separator } from '@/components/ui/separator';
import { AreaSearchBar } from '@/components/geofencing/AreaSearchBar';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { Map, MapPin } from 'lucide-react';

interface LocationInputFieldProps {
  label: string;
  addressValue: string;
  onAddressChange: (value: string) => void;
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showGPSPicker?: boolean;
  showPlacesSearch?: boolean;
  showMapPicker?: boolean;
}

export const LocationInputField = ({
  label,
  addressValue,
  onAddressChange,
  onLocationSelect,
  placeholder = "Enter address",
  required = false,
  disabled = false,
  showGPSPicker = true,
  showPlacesSearch = true,
  showMapPicker = true
}: LocationInputFieldProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);

  const handleGPSLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setSelectedLocation({ latitude: location.latitude, longitude: location.longitude });
    if (location.address) {
      onAddressChange(location.address);
    }
    onLocationSelect(location);
  };

  const handlePlaceSelect = (result: { lat: number; lng: number; address: string }) => {
    setSelectedLocation({ latitude: result.lat, longitude: result.lng });
    onAddressChange(result.address);
    onLocationSelect({ latitude: result.lat, longitude: result.lng, address: result.address });
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="address">{label} {required && '*'}</Label>
      
      {/* Manual Address Input */}
      <Input
        id="address"
        value={addressValue}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />

      {/* Location Options */}
      {(showGPSPicker || showPlacesSearch || showMapPicker) && !disabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* GPS Location Picker */}
            {showGPSPicker && (
              <GPSLocationPicker
                onLocationSelect={handleGPSLocationSelect}
                disabled={disabled}
              />
            )}

            {/* Map Location Picker */}
            {showMapPicker && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMapDialog(true)}
                disabled={disabled}
                className="w-full flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Choose on Map
              </Button>
            )}

            {/* Places Search */}
            {showPlacesSearch && (
              <div>
                <AreaSearchBar
                  onLocationSelect={handlePlaceSelect}
                  placeholder="Search for address..."
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Picker Dialog */}
      <MapLocationPicker
        isOpen={showMapDialog}
        onClose={() => setShowMapDialog(false)}
        onLocationSelect={handleGPSLocationSelect}
        initialLocation={selectedLocation ? {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          address: addressValue
        } : undefined}
        title="Choose Delivery Location"
      />

      {/* Location Status */}
      {selectedLocation && (
        <div className="text-xs text-muted-foreground">
          📍 Location coordinates captured: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
};