import { MapPin } from 'lucide-react';

interface DeliveryMapProps {
  lat?: number;
  lng?: number;
  address?: string;
  className?: string;
}

export function DeliveryMap({ lat, lng, address, className = "w-full h-48" }: DeliveryMapProps) {
  // This is a placeholder component that can be enhanced with actual map integration
  // You could integrate with Google Maps, Mapbox, or any other mapping service
  
  const openInMaps = () => {
    if (lat && lng) {
      // Open in device's default maps app
      const url = `https://maps.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (address) {
      // Search by address
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`${className} bg-muted rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-muted/80 transition-colors`} onClick={openInMaps}>
      <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-medium text-center mb-1">
        {lat && lng ? 'View Location on Map' : 'Open in Maps'}
      </p>
      {lat && lng && (
        <p className="text-xs text-muted-foreground text-center">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      )}
      {address && (
        <p className="text-xs text-muted-foreground text-center max-w-full truncate">
          {typeof address === 'string' ? address : JSON.stringify(address)}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Click to open in external maps
      </p>
    </div>
  );
}