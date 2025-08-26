
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTestFeeCalculation } from '@/hooks/base-location-hooks';
import { Calculator, MapPin } from 'lucide-react';

export function FeeTestingPanel() {
  const [testData, setTestData] = useState({
    lat: '',
    lng: '',
    serviceType: 'delivery' as 'delivery' | 'lab_collection'
  });
  const [results, setResults] = useState<any[]>([]);
  
  const testFeeCalculation = useTestFeeCalculation();

  const handleTest = async () => {
    if (!testData.lat || !testData.lng) return;

    try {
      const result = await testFeeCalculation.mutateAsync({
        lat: parseFloat(testData.lat),
        lng: parseFloat(testData.lng),
        serviceType: testData.serviceType
      });
      setResults(result);
    } catch (error) {
      console.error('Error testing fee calculation:', error);
      setResults([]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Fee Calculation Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test_lat">Test Latitude</Label>
            <Input
              id="test_lat"
              type="number"
              step="any"
              value={testData.lat}
              onChange={(e) => setTestData(prev => ({ ...prev, lat: e.target.value }))}
              placeholder="24.817"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test_lng">Test Longitude</Label>
            <Input
              id="test_lng"
              type="number"
              step="any"
              value={testData.lng}
              onChange={(e) => setTestData(prev => ({ ...prev, lng: e.target.value }))}
              placeholder="93.938"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Service Type</Label>
          <Select
            value={testData.serviceType}
            onValueChange={(value: 'delivery' | 'lab_collection') => 
              setTestData(prev => ({ ...prev, serviceType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delivery">Medicine Delivery</SelectItem>
              <SelectItem value="lab_collection">Lab Collection</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleTest}
          disabled={testFeeCalculation.isPending || !testData.lat || !testData.lng}
          className="w-full"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {testFeeCalculation.isPending ? 'Calculating...' : 'Test Fee Calculation'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Calculation Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Base: {result.base_name}</span>
                  <Badge variant="default">₹{result.fee}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Distance: {result.distance_km} km</div>
                  {result.geofence_name && (
                    <div>Geofence: {result.geofence_name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && testFeeCalculation.isSuccess && (
          <div className="text-center text-muted-foreground py-4">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No base locations found for this area</p>
            <p className="text-sm">Consider creating a base location for this region</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
