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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Pickup Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            We need your location for our collection team to visit you for sample pickup.
          </AlertDescription>
        </Alert>

        {!showManualForm ? (
          <div className="space-y-4">
            <Button
              onClick={getCurrentLocation}
              disabled={isCapturing}
              className="w-full"
              size="lg"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isCapturing ? 'Getting Location...' : 'Use Current Location'}
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-muted-foreground">or</span>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowManualForm(true)}
              className="w-full"
            >
              Enter Address Manually
            </Button>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Contact Name *</Label>
                <Input
                  id="name"
                  value={manualAddress.name}
                  onChange={(e) => setManualAddress(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter contact name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={manualAddress.phone}
                  onChange={(e) => setManualAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address1">Address Line 1 *</Label>
              <Input
                id="address1"
                value={manualAddress.address_line_1}
                onChange={(e) => setManualAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                placeholder="House/Flat/Office No, Building Name"
                required
              />
            </div>

            <div>
              <Label htmlFor="address2">Address Line 2</Label>
              <Input
                id="address2"
                value={manualAddress.address_line_2}
                onChange={(e) => setManualAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                placeholder="Area, Locality"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={manualAddress.city}
                  onChange={(e) => setManualAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={manualAddress.state}
                  onChange={(e) => setManualAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={manualAddress.pincode}
                  onChange={(e) => setManualAddress(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Pincode"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={manualAddress.landmark}
                onChange={(e) => setManualAddress(prev => ({ ...prev, landmark: e.target.value }))}
                placeholder="Nearby landmark (optional)"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Save Address
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManualForm(false)}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}