import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { Separator } from '@/components/ui/separator';
import { AreaSearchBar } from '@/components/geofencing/AreaSearchBar';

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
  showPlacesSearch = true
}: LocationInputFieldProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
      {(showGPSPicker || showPlacesSearch) && !disabled && (
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

      {/* Location Status */}
      {selectedLocation && (
        <div className="text-xs text-muted-foreground">
          📍 Location coordinates captured: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
        </div>
      )}
    </div>
  );
};