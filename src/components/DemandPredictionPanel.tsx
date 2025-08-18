import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  Calendar, 
  Clock, 
  MapPin, 
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';
import { usePredictedDemand } from '@/hooks/use-demand-recommendations';

export function DemandPredictionPanel() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');

  // Create target datetime
  const targetDateTime = new Date(`${selectedDate}T${selectedTime}`);
  
  const { data: predictions, isLoading, error } = usePredictedDemand(
    targetDateTime,
    city.trim() || undefined,
    pincode.trim() || undefined,
    8
  );

  const isCurrentTime = () => {
    const now = new Date();
    const diffMinutes = Math.abs(targetDateTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes < 30; // Within 30 minutes is "current"
  };

  const getTimeLabel = () => {
    if (isCurrentTime()) return 'Right Now';
    
    const now = new Date();
    if (targetDateTime.toDateString() === now.toDateString()) {
      return `Today at ${selectedTime}`;
    }
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetDateTime.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${selectedTime}`;
    }
    
    return targetDateTime.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Demand Prediction
          <Badge variant="outline" className="ml-auto flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Prediction Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              City (Optional)
            </Label>
            <Input
              id="city"
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode (Optional)</Label>
            <Input
              id="pincode"
              placeholder="e.g. 400001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
        </div>

        {/* Prediction Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Predicted Demand for {getTimeLabel()}
            </h3>
            {predictions && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {predictions.length} medicines
              </Badge>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Unable to generate predictions</p>
              <p className="text-xs">Try adjusting your parameters</p>
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {predictions.map((medicine, index) => (
                <Card key={medicine.medicine_id} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Badge 
                          variant={medicine.score >= 10 ? 'destructive' : medicine.score >= 5 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          Score: {Math.round(medicine.score * 100) / 100}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-sm line-clamp-2">
                        {medicine.name}
                      </h4>
                      
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">₹{medicine.price.toLocaleString('en-IN')}</span>
                        </div>
                        {medicine.expected_qty > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected:</span>
                            <span className="font-medium">{Math.ceil(medicine.expected_qty)} units</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No demand predictions for this time and location</p>
              <p className="text-xs">Try a different time or remove location filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}