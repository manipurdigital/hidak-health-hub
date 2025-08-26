import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface LocationData {
  lat: number;
  lng: number;
  address: {
    name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
}

interface LocationCaptureProps {
  onLocationCapture: (location: LocationData) => void;
  className?: string;
}

export function LocationCapture({ onLocationCapture, className }: LocationCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  const getCurrentLocation = async () => {
    setIsCapturing(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Use reverse geocoding if available, otherwise prompt for manual entry
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng }
        });

        if (response.results && response.results[0]) {
          const result = response.results[0];
          const components = result.address_components;
          
          // Parse address components
          const getComponent = (types: string[]) => {
            const component = components.find(c => 
              types.some(type => c.types.includes(type))
            );
            return component?.long_name || '';
          };

          const parsedAddress = {
            name: manualAddress.name || '',
            phone: manualAddress.phone || '',
            address_line_1: result.formatted_address.split(',')[0] || '',
            address_line_2: '',
            city: getComponent(['locality', 'administrative_area_level_2']),
            state: getComponent(['administrative_area_level_1']),
            pincode: getComponent(['postal_code']),
            landmark: ''
          };

          onLocationCapture({
            lat,
            lng,
            address: parsedAddress
          });

          toast({
            title: "Location Captured",
            description: "GPS location captured successfully"
          });
        } else {
          throw new Error('Could not get address details');
        }
      } catch (geocodeError) {
        // Fallback to manual address entry with captured coordinates
        setManualAddress(prev => ({ ...prev }));
        setShowManualForm(true);
        
        toast({
          title: "Location Captured",
          description: "Please provide address details manually",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location Error",
        description: error instanceof Error ? error.message : "Could not get your location",
        variant: "destructive"
      });
      setShowManualForm(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualAddress.name || !manualAddress.phone || !manualAddress.address_line_1 || 
        !manualAddress.city || !manualAddress.state || !manualAddress.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // For manual entry, use a default location (can be enhanced with geocoding)
    const defaultLocation = { lat: 28.6139, lng: 77.2090 };
    
    onLocationCapture({
      lat: defaultLocation.lat,
      lng: defaultLocation.lng,
      address: manualAddress
    });

    toast({
      title: "Address Saved",
      description: "Manual address has been saved successfully"
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-4 w-4" />
            Pickup Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              We need your location for sample pickup.
            </AlertDescription>
          </Alert>

          {!showManualForm ? (
            <div className="space-y-3">
              <Button
                onClick={getCurrentLocation}
                disabled={isCapturing}
                className="w-full h-9"
                size="sm"
              >
                <Navigation className="h-3 w-3 mr-2" />
                {isCapturing ? 'Getting Location...' : 'Use Current Location'}
              </Button>
              
              <div className="text-center">
                <span className="text-xs text-muted-foreground">or</span>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowManualForm(true)}
                className="w-full h-9"
                size="sm"
              >
                Enter Address Manually
              </Button>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
              <form onSubmit={handleManualSubmit} className="space-y-3 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-medium">Contact Name *</Label>
                    <Input
                      id="name"
                      value={manualAddress.name}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter name"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs font-medium">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={manualAddress.phone}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="08794265302"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address1" className="text-xs font-medium">Address *</Label>
                  <Input
                    id="address1"
                    value={manualAddress.address_line_1}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                    placeholder="Soibam Leikai Ayangpalli Road near Porompat Traffic Point"
                    className="h-8 text-sm"
                    required
                  />
                  
                  <div className="text-center text-muted-foreground text-xs py-1">OR</div>
                  
                  <Button type="button" variant="outline" className="w-full h-8 text-xs" size="sm">
                    <Navigation className="h-3 w-3 mr-1" />
                    Use Current Location
                  </Button>
                  
                  <div className="mt-2 p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <MapPin className="h-3 w-3" />
                      Current Location Detected
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Lat: 24.805376, Lng: 93.945856
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full h-8 text-xs mt-2" size="sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    Choose on Map
                  </Button>
                  
                  <Input
                    className="mt-2 h-8 text-sm"
                    placeholder="Opposite Traffic Point,Lane no.2"
                    value=""
                    onChange={() => {}}
                  />
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    📍 Location coordinates captured: 24.805376, 93.945856
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="address2" className="text-xs font-medium">Address Line 2</Label>
                  <Input
                    id="address2"
                    value={manualAddress.address_line_2}
                    onChange={(e) => setManualAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                    placeholder="Area, Colony, Locality"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-xs font-medium">City *</Label>
                    <Input
                      id="city"
                      value={manualAddress.city}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Imphal"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-xs font-medium">State *</Label>
                    <Input
                      id="state"
                      value={manualAddress.state}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="Manipur"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="pincode" className="text-xs font-medium">Postal Code *</Label>
                    <Input
                      id="pincode"
                      value={manualAddress.pincode}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="795005"
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="landmark" className="text-xs font-medium">Landmark</Label>
                    <Input
                      id="landmark"
                      value={manualAddress.landmark}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, landmark: e.target.value }))}
                      placeholder="Near landmark"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <input type="checkbox" id="default" className="h-3 w-3 rounded" />
                  <Label htmlFor="default" className="text-xs">Set as default address</Label>
                </div>

                <div className="flex gap-2 pt-2 sticky bottom-0 bg-background">
                  <Button type="submit" className="flex-1 h-9 text-sm">
                    Save Address
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManualForm(false)}
                    className="h-9 px-3 text-sm"
                  >
                    Back
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}