import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { GPSLocationPicker } from '@/components/GPSLocationPicker';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import { FirstVisitWhatsAppDialog } from '@/components/FirstVisitWhatsAppDialog';
import { useServiceability } from '@/contexts/ServiceabilityContext';
import { MapIcon, Navigation, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'svc:first_visit_completed';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '918794265302';

interface FirstVisitFlowGateProps {
  children: React.ReactNode;
}

export function FirstVisitFlowGate({ children }: FirstVisitFlowGateProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'location' | 'whatsapp' | 'blocked'>('location');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  
  const { location, setManualLocation, inDeliveryArea, inLabArea, error } = useServiceability();

  useEffect(() => {
    // Check if first visit flow was already completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === 'true') {
      setIsCompleted(true);
    }
  }, []);

  useEffect(() => {
    // Check serviceability when location changes
    if (locationSelected && location) {
      setIsCheckingServiceability(true);
      
      // Use loading state from context instead of timeout
      if (!isCheckingServiceability) {
        setIsCheckingServiceability(false);
        
        // Check if location is serviceable
        const isServiceable = inDeliveryArea || inLabArea;
        
        if (isServiceable) {
          setCurrentStep('whatsapp');
        } else {
          setCurrentStep('blocked');
        }
      }
    }
  }, [location, locationSelected, inDeliveryArea, inLabArea]);

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setManualLocation({ lat: location.latitude, lng: location.longitude, address: location.address });
    setLocationSelected(true);
  };

  const handleMapLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setShowMapPicker(false);
    handleLocationSelect(location);
  };

  const handleWhatsAppClose = () => {
    // Mark flow as completed and allow website access
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsCompleted(true);
  };

  const handleChangeLocation = () => {
    setCurrentStep('location');
    setLocationSelected(false);
  };

  const handleContactWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I'm trying to access your website but my area seems to be out of service. Can you help me with orders from my location?"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  // If flow is completed, render children
  if (isCompleted) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg mx-4" hideClose preventClose>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              🏥 Welcome to Hakshel Healthcare
            </DialogTitle>
          </DialogHeader>

          {currentStep === 'location' && (
            <div className="space-y-6 pt-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  First, let's check if we serve your area
                </p>
                <p className="text-sm text-muted-foreground">
                  We need your location to verify our service availability
                </p>
              </div>

              <div className="space-y-4">
                <GPSLocationPicker
                  onLocationSelect={handleLocationSelect}
                  className="w-full"
                />

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">or</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowMapPicker(true)}
                  className="w-full flex items-center gap-2"
                >
                  <MapIcon className="w-4 h-4" />
                  Choose location on map
                </Button>
              </div>

              {isCheckingServiceability && (
                <Alert>
                  <Navigation className="w-4 h-4" />
                  <AlertDescription>
                    Checking service availability for your location...
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Unable to verify service availability. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {currentStep === 'blocked' && (
            <div className="space-y-6 pt-4">
              <div className="text-center space-y-4">
                <div className="text-6xl">😔</div>
                <div>
                  <p className="text-lg font-semibold text-destructive">
                    Sorry! We don't serve your area yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    We're working hard to expand our services to your location
                  </p>
                </div>
              </div>

              {location?.address && (
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm">
                      <strong>Your location:</strong> {location.address}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleChangeLocation}
                  className="w-full"
                >
                  Try different location
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {currentStep === 'whatsapp' && (
        <FirstVisitWhatsAppDialog onClose={handleWhatsAppClose} />
      )}

      {showMapPicker && (
        <MapLocationPicker
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onLocationSelect={handleMapLocationSelect}
          title="Choose your location"
        />
      )}
    </>
  );
}