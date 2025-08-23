import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { AreaSearchBar } from '@/components/geofencing/AreaSearchBar';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { MapPin, Search, Map } from 'lucide-react';

interface QuickLocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  className?: string;
  title?: string;
  description?: string;
}

export const QuickLocationInput = ({ 
  onLocationSelect, 
  className,
  title = "Quick Location Access",
  description = "Use your current location or search for an address"
}: QuickLocationInputProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);

  const handlePlaceSelect = (result: { lat: number; lng: number; address: string }) => {
    onLocationSelect({ 
      latitude: result.lat, 
      longitude: result.lng, 
      address: result.address 
    });
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {!showOptions ? (
            <Button 
              variant="outline" 
              onClick={() => setShowOptions(true)}
              className="w-full"
            >
              <Search className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          ) : (
            <div className="space-y-3">
              <GPSLocationPicker
                onLocationSelect={onLocationSelect}
              />
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMapDialog(true)}
                className="w-full flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Choose on Map
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <AreaSearchBar
                onLocationSelect={handlePlaceSelect}
                placeholder="Search for location..."
                className="w-full"
              />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowOptions(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}
          
          <MapLocationPicker
            isOpen={showMapDialog}
            onClose={() => setShowMapDialog(false)}
            onLocationSelect={onLocationSelect}
            title="Select Location"
          />
        </div>
      </CardContent>
    </Card>
  );
};