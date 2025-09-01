import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';

interface ServiceAreaGuardProps {
  lat: number;
  lng: number;
  serviceType: 'delivery' | 'lab_collection';
  children: React.ReactNode;
  showWarning?: boolean;
}

export function ServiceAreaGuard({ 
  lat, 
  lng, 
  serviceType, 
  children, 
  showWarning = true 
}: ServiceAreaGuardProps) {
  const [isServiceable, setIsServiceable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkServiceArea();
  }, [lat, lng, serviceType]);

  const checkServiceArea = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('is_location_serviceable', {
        p_lat: lat,
        p_lng: lng,
        p_service_type: serviceType
      });

      if (error) {
        console.error('Error checking service area:', error);
        setIsServiceable(false);
      } else {
        setIsServiceable(data);
      }
    } catch (error) {
      console.error('Service area check failed:', error);
      setIsServiceable(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Checking service area...</span>
      </div>
    );
  }

  if (!isServiceable && showWarning) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          This location is outside our current service area for {serviceType === 'delivery' ? 'medicine delivery' : 'lab collection'}.
          {/* For now, we're only serving within Imphal geofences. */}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {!isServiceable && (
        <div className="mb-4">
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" />
            Outside Service Area
          </Badge>
        </div>
      )}
      {children}
    </div>
  );
}