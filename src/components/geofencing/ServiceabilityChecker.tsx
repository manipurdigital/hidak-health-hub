import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, CheckCircle, XCircle, Building, Store } from 'lucide-react';
import { AreaSearchBar } from './AreaSearchBar';
import { useCheckServiceability, useCoverage, useFeePreview } from '@/hooks/geofencing-hooks';

export function ServiceabilityChecker() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [serviceType, setServiceType] = useState<'delivery' | 'lab_collection'>('delivery');
  const [results, setResults] = useState<any[]>([]);
  const [coverageResults, setCoverageResults] = useState<any[]>([]);
  const [feePreview, setFeePreview] = useState<any>(null);

  const checkServiceability = useCheckServiceability();
  const checkCoverage = useCoverage();
  const previewFee = useFeePreview();

  const handleCheck = async () => {
    if (!latitude || !longitude || !serviceType) {
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    try {
      // Check for partners first
      const partners = await checkServiceability.mutateAsync({
        lat,
        lng,
        serviceType
      });
      
      setResults(partners || []);

      // If no partners, check coverage
      if (!partners || partners.length === 0) {
        const coverage = await checkCoverage.mutateAsync({
          lat,
          lng,
          serviceType: serviceType as 'delivery' | 'lab_collection'
        });
        setCoverageResults(coverage || []);
      } else {
        setCoverageResults([]);
      }

      // Preview fee for delivery
      if (serviceType === 'delivery') {
        const fee = await previewFee.mutateAsync({ lat, lng });
        setFeePreview(fee);
      } else {
        setFeePreview(null);
      }
    } catch (error) {
      console.error('Error checking serviceability:', error);
      setResults([]);
      setCoverageResults([]);
      setFeePreview(null);
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

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setLatitude(location.lat.toString());
    setLongitude(location.lng.toString());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Test Serviceability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label>Search Location</Label>
            <AreaSearchBar
              onLocationSelect={handleLocationSelect}
              placeholder="Search for a location..."
            />
          </div>

          {/* Manual Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Enter latitude"
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Enter longitude"
                step="any"
              />
            </div>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleCheck} 
              disabled={!latitude || !longitude || !serviceType || checkServiceability.isPending}
            >
              {checkServiceability.isPending ? 'Checking...' : 'Check Serviceability'}
            </Button>
            <Button variant="outline" onClick={getCurrentLocation}>
              <Navigation className="h-4 w-4 mr-2" />
              Use Current Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(results.length > 0 || coverageResults.length > 0 || checkServiceability.isSuccess) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results</h3>
          
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((center, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {center.center_name || center.store_name || 'Service Center'}
                          </Badge>
                          <Badge variant="outline">Priority: {center.priority}</Badge>
                        </div>
                        
                        {center.geofence_name && (
                          <p className="text-sm text-muted-foreground">
                            Area: {center.geofence_name}
                          </p>
                        )}
                        
                        {center.geofence_id && (
                          <p className="text-xs font-mono text-muted-foreground">
                            ID: {center.geofence_id}
                          </p>
                        )}
                      </div>
                      
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Available
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : coverageResults.length > 0 ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-medium">
                      Available in your area – partners onboarding
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      This location is within our service area. Partners are being onboarded and will be available soon.
                    </p>
                    {coverageResults[0]?.geofence_name && (
                      <p className="text-sm text-blue-600 mt-2">
                        Area: {coverageResults[0].geofence_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-orange-800 font-medium">
                      Out of service area
                    </p>
                    <p className="text-orange-700 text-sm mt-1">
                      This location is not currently covered by our service areas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fee Preview for Delivery */}
          {feePreview && serviceType === 'delivery' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-800 font-medium">Delivery Fee Preview</p>
                    <p className="text-purple-700 text-sm">
                      Distance: {feePreview.distance_km} km from {feePreview.geofence_name}
                    </p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                    ₹{feePreview.fee}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}