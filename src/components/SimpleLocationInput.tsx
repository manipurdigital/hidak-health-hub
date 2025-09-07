import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { Separator } from '@/components/ui/separator';
import { MapPin } from 'lucide-react';

interface SimpleLocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  placeholder?: string;
}

export const SimpleLocationInput = ({
  onLocationSelect,
  placeholder = "Enter your address"
}: SimpleLocationInputProps) => {
  const [address, setAddress] = useState('');

  const handleGPSLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    if (location.address) {
      setAddress(location.address);
    }
    onLocationSelect(location);
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

        <GPSLocationPicker
          onLocationSelect={handleGPSLocationSelect}
        />
      </div>
    </div>
  );
};