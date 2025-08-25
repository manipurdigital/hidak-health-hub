import React from 'react';
import { MapPin, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LatLngDisplayProps {
  latitude: number | null;
  longitude: number | null;
  className?: string;
  showCopyButton?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export const LatLngDisplay = ({ 
  latitude, 
  longitude, 
  className = "", 
  showCopyButton = false,
  variant = 'default'
}: LatLngDisplayProps) => {
  const { toast } = useToast();

  if (!latitude || !longitude) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No location data available
      </div>
    );
  }

  const handleCopyCoordinates = () => {
    const coordinates = `${latitude}, ${longitude}`;
    navigator.clipboard.writeText(coordinates);
    toast({
      title: "Coordinates copied",
      description: `${coordinates} copied to clipboard`
    });
  };

  const formatCoordinate = (value: number, precision: number = 6) => {
    return value.toFixed(precision);
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}>
        <MapPin className="h-3 w-3" />
        <span>{formatCoordinate(latitude, 4)}, {formatCoordinate(longitude, 4)}</span>
        {showCopyButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCoordinates}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="font-medium">Location Coordinates</span>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Latitude:</span>
              <div className="font-mono">{formatCoordinate(latitude)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude:</span>
              <div className="font-mono">{formatCoordinate(longitude)}</div>
            </div>
          </div>
          {showCopyButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCoordinates}
              className="w-full"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy Coordinates
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span>
          <span className="text-muted-foreground">Lat:</span> {formatCoordinate(latitude)}, 
          <span className="text-muted-foreground ml-2">Lng:</span> {formatCoordinate(longitude)}
        </span>
      </div>
      {showCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyCoordinates}
          className="h-8 px-2"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};