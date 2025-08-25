import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { GPSLocationPicker } from "@/components/GPSLocationPicker";
import { MapLocationPicker } from "@/components/MapLocationPicker";
import { useServiceability } from "@/contexts/ServiceabilityContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface HomeLocationGateProps {
  onLocationConfirmed: () => void;
}

export const HomeLocationGate = ({ onLocationConfirmed }: HomeLocationGateProps) => {
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [serviceabilityError, setServiceabilityError] = useState<string | null>(null);
  const { setManualLocation, deliveryCoverage, labCoverage, location } = useServiceability();

  // Check serviceability when location changes
  useEffect(() => {
    if (location && !isCheckingServiceability) {
      setIsCheckingServiceability(true);
      setServiceabilityError(null);
      
      // Wait a bit for serviceability context to update
      const timer = setTimeout(() => {
        if (!deliveryCoverage && !labCoverage) {
          setServiceabilityError("No service available in your area. Please try a different location.");
        } else {
          // Location is serviceable, allow access
          onLocationConfirmed();
        }
        setIsCheckingServiceability(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location, deliveryCoverage, labCoverage, onLocationConfirmed, isCheckingServiceability]);

  const handleLocationSelect = (locationData: any) => {
    setIsCheckingServiceability(true);
    setServiceabilityError(null);
    setManualLocation({
      lat: locationData.lat,
      lng: locationData.lng,
      address: locationData.address || `${locationData.lat}, ${locationData.lng}`
    });
  };

  const handleMapLocationSelect = (locationData: any) => {
    setShowMapPicker(false);
    handleLocationSelect(locationData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold">Enable Location Access</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              We need your location to show nearby services and provide accurate delivery information.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {serviceabilityError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serviceabilityError}</AlertDescription>
              </Alert>
            )}

            {isCheckingServiceability && (
              <Alert>
                <Navigation className="h-4 w-4 animate-spin" />
                <AlertDescription>Checking service availability in your area...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <GPSLocationPicker 
                onLocationSelect={handleLocationSelect}
                className="w-full"
                disabled={isCheckingServiceability}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setShowMapPicker(true)}
                disabled={isCheckingServiceability}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Choose on Map
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center mt-4">
              <p>Location access is required to use our services.</p>
              <p>Please ensure location is enabled on your device.</p>
            </div>
          </CardContent>
        </Card>

        <MapLocationPicker
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
          title="Choose Your Location"
        />
      </div>
    </div>
  );
};