import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCheckServiceability } from '@/hooks/geofencing-hooks';
import { MapPin, CheckCircle, XCircle, Building, Store } from 'lucide-react';

export function ServiceabilityChecker() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [serviceType, setServiceType] = useState<'delivery' | 'lab_collection'>('delivery');
  const [results, setResults] = useState<any[]>([]);
  
  const checkServiceability = useCheckServiceability();

  const handleCheck = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    try {
      const centers = await checkServiceability.mutateAsync({
        lat,
        lng,
        serviceType,
      });
      setResults(centers);
    } catch (error) {
      console.error('Error checking serviceability:', error);
      setResults([]);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Serviceability Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="28.6139"
            />
          </div>
          
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="77.2090"
            />
          </div>

          <div>
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={serviceType} onValueChange={(value: 'delivery' | 'lab_collection') => setServiceType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Medicine Delivery</SelectItem>
                <SelectItem value="lab_collection">Lab Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCheck} disabled={checkServiceability.isPending || !latitude || !longitude}>
            {checkServiceability.isPending ? 'Checking...' : 'Check Serviceability'}
          </Button>
          <Button variant="outline" onClick={getCurrentLocation}>
            Use Current Location
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Service Available!</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Available Centers:</h4>
              {results.map((center, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {serviceType === 'delivery' ? (
                      <Store className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Building className="h-4 w-4 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {serviceType === 'delivery' ? center.store_name : center.center_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Geofence: {center.geofence_name}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Priority {center.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : results.length === 0 && checkServiceability.isSuccess ? (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">No service available for this location</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}