import { MapPin, Truck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServiceability } from "@/contexts/ServiceabilityContext";

interface LocationBannerProps {
  onLocationClick?: () => void;
}

export const LocationBanner = ({ onLocationClick }: LocationBannerProps) => {
  const { location, deliveryCoverage, labCoverage, feePreview } = useServiceability();
  
  const inDeliveryArea = deliveryCoverage === 'has_partners' || deliveryCoverage === 'available_no_partner';
  const inLabCoverage = labCoverage === 'has_partners' || labCoverage === 'available_no_partner';

  if (!location) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Set your location to check delivery availability
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onLocationClick}>
              <MapPin className="w-4 h-4 mr-2" />
              Set Location
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
              </span>
              <Button variant="ghost" size="sm" onClick={onLocationClick} className="h-auto p-0 text-primary hover:text-primary/80">
                Change
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {inDeliveryArea && (
                <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                  <Truck className="w-3 h-3 mr-1" />
                  Delivery Available
                  {feePreview?.fee && ` • ₹${feePreview.fee}`}
                </Badge>
              )}
              
              {inLabCoverage && (
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                  Lab Collection Available
                </Badge>
              )}
              
              {!inDeliveryArea && !inLabCoverage && (
                <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Limited Services
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};