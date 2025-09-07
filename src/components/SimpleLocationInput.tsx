import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { Separator } from '@/components/ui/separator';
import { MapPin, Map } from 'lucide-react';

interface SimpleLocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  placeholder?: string;
}

export const SimpleLocationInput = ({
  onLocationSelect,
  placeholder = "Enter your address"
}: SimpleLocationInputProps) => {
  const [address, setAddress] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleGPSLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    if (location.address) {
      setAddress(location.address);
    }
    onLocationSelect(location);
  };

  const handleMapLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    if (location.address) {
      setAddress(location.address);
    }
    onLocationSelect(location);
    setShowMapPicker(false);
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Address & Location *
      </Label>
      
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={placeholder}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <div className="flex gap-2">
          <GPSLocationPicker
            onLocationSelect={handleGPSLocationSelect}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMapPicker(true)}
            className="flex items-center gap-2"
          >
            <Map className="h-4 w-4" />
            Choose from Map
          </Button>
        </div>
      </div>

      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        title="Select Location on Map"
      />
    </div>
  );
};