import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Clock, StopCircle, PlayCircle } from 'lucide-react';
import { useCourierLocation, useSendLocationUpdate } from '@/hooks/tracking-hooks';

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 28.6139, // Delhi coordinates as default
  lng: 77.2090
};

interface TrackingMapProps {
  jobType: 'lab' | 'delivery';
  jobId: string;
  centerId: string;
  centerType: 'lab' | 'delivery';
  destinationAddress?: string;
  customerName?: string;
  etaMinutes?: number | null;
  distanceMeters?: number | null;
  isStaff?: boolean;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  jobType,
  jobId,
  centerId,
  centerType,
  destinationAddress,
  customerName,
  etaMinutes,
  distanceMeters,
  isStaff = false
}) => {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLng | null>(null);

  const { data: courierLocation } = useCourierLocation(jobType, jobId);
  const sendLocationUpdate = useSendLocationUpdate();

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Geocode destination address
  useEffect(() => {
    if (isLoaded && destinationAddress && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: destinationAddress }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setDestination(results[0].geometry.location);
        }
      });
    }
  }, [isLoaded, destinationAddress]);

  // Calculate directions when courier location and destination are available
  useEffect(() => {
    if (isLoaded && courierLocation && destination && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route({
        origin: new window.google.maps.LatLng(courierLocation.lat, courierLocation.lng),
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          setDirections(result);
        }
      });
    }
  }, [isLoaded, courierLocation, destination]);

  const startTracking = useCallback(() => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed, heading } = position.coords;
          
          sendLocationUpdate.mutate({
            centerId,
            centerType,
            jobId,
            jobType,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
    }
  }, [centerId, centerType, jobId, jobType, sendLocationUpdate]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading map...</div>
        </CardContent>
      </Card>
    );
  }

  const center = courierLocation 
    ? { lat: courierLocation.lat, lng: courierLocation.lng }
    : defaultCenter;

  return (
    <div className="space-y-4">
      {/* Status and ETA Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {jobType === 'lab' ? 'Lab Collection' : 'Medicine Delivery'}
            </CardTitle>
            {isStaff && (
              <div className="flex gap-2">
                {!isTracking ? (
                  <Button onClick={startTracking} size="sm" className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Start Tracking
                  </Button>
                ) : (
                  <Button onClick={stopTracking} size="sm" variant="destructive" className="flex items-center gap-2">
                    <StopCircle className="h-4 w-4" />
                    Stop Tracking
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {customerName && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Customer:</span>
              <span>{customerName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {etaMinutes !== null && etaMinutes !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ETA: {etaMinutes} min
              </Badge>
            )}
            
            {distanceMeters !== null && distanceMeters !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                {(distanceMeters / 1000).toFixed(1)} km away
              </Badge>
            )}
            
            {isTracking && (
              <Badge variant="default" className="bg-green-500">
                Live Tracking Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={14}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Courier/Delivery person marker */}
            {courierLocation && (
              <Marker
                position={{ lat: courierLocation.lat, lng: courierLocation.lng }}
                icon={{
                  url: '/api/placeholder/32/32',
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
                title="Delivery Person"
              />
            )}

            {/* Destination marker */}
            {destination && (
              <Marker
                position={destination}
                icon={{
                  url: '/api/placeholder/32/32',
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
                title="Destination"
              />
            )}

            {/* Directions */}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true, // We're using custom markers
                  polylineOptions: {
                    strokeColor: '#3B82F6',
                    strokeWeight: 4,
                  }
                }}
              />
            )}
          </GoogleMap>
        </CardContent>
      </Card>
    </div>
  );
};