import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Package, TestTube, AlertCircle } from 'lucide-react';
import { TrackingMap } from '@/components/tracking/TrackingMap';
import { usePublicTracking } from '@/hooks/tracking-hooks';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';

export default function PublicTrackingPage() {
  const { jobType, jobId, token } = useParams<{ 
    jobType: string; 
    jobId: string; 
    token: string; 
  }>();

  // Map jobType to tracking type
  const type = jobType === 'lab' ? 'lab' : 'order';
  const id = jobId;

  const { data: trackingData, isLoading, error } = usePublicTracking(
    type,
    id || '',
    token || ''
  );

  if (!jobType || !jobId || !token || (jobType !== 'lab' && jobType !== 'order')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Tracking Link</h2>
            <p className="text-muted-foreground">
              The tracking link you followed appears to be invalid or incomplete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading tracking information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tracking Not Available</h2>
            <p className="text-muted-foreground">
              This tracking link has expired or the order/booking has been completed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'Assigned to collection team';
      case 'en_route':
        return 'On the way to collect';
      case 'collected':
        return 'Sample collected successfully';
      case 'packed':
        return 'Order packed and ready';
      case 'out_for_delivery':
        return 'Out for delivery';
      case 'delivered':
        return 'Delivered successfully';
      default:
        return status.replace('_', ' ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
      case 'packed':
        return 'bg-yellow-500';
      case 'en_route':
      case 'out_for_delivery':
        return 'bg-blue-500';
      case 'collected':
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const isLabType = type === 'lab';
  const isOrderType = type === 'order';

  return (
    <GoogleMapsProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              {type === 'lab' ? (
                <TestTube className="h-8 w-8 text-primary" />
              ) : (
                <Package className="h-8 w-8 text-primary" />
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {type === 'lab' ? 'Lab Collection Tracking' : 'Delivery Tracking'}
                </h1>
                <p className="text-muted-foreground">
                  Track your {type === 'lab' ? 'sample collection' : 'medicine delivery'} in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Current Status
                <Badge className={`${getStatusColor(trackingData.status)} text-white`}>
                  {getStatusText(trackingData.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLabType && 'patient_name' in trackingData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Patient Name</h4>
                      <p>{trackingData.patient_name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Test</h4>
                      <p>{trackingData.test_name}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Appointment Date</h4>
                      <p>{new Date(trackingData.booking_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Time Slot</h4>
                      <p>{trackingData.time_slot}</p>
                    </div>
                  </div>
                </>
              ) : isOrderType && 'order_number' in trackingData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold">Order Number</h4>
                      <p>{trackingData.order_number}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Order Amount</h4>
                      <p>₹{trackingData.total_amount}</p>
                    </div>
                  </div>
                </>
              ) : null}

              {trackingData.last_eta_mins && (
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <Clock className="h-5 w-5" />
                  Arriving in ~{trackingData.last_eta_mins} minutes
                </div>
              )}

              {trackingData.last_distance_meters && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {(trackingData.last_distance_meters / 1000).toFixed(1)} km away
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Map - only show if not completed */}
          {trackingData.status !== 'collected' && trackingData.status !== 'delivered' && (
            <TrackingMap
              jobType={type === 'lab' ? 'lab' : 'delivery'}
              jobId={id}
              centerId=""
              centerType={type === 'lab' ? 'lab' : 'delivery'}
              etaMinutes={trackingData.last_eta_mins}
              distanceMeters={trackingData.last_distance_meters}
              isStaff={false}
            />
          )}

          {/* Completion Message */}
          {(trackingData.status === 'collected' || trackingData.status === 'delivered') && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-green-500 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {type === 'lab' ? 'Sample Collected Successfully!' : 'Order Delivered Successfully!'}
                </h3>
                <p className="text-muted-foreground">
                  {type === 'lab' 
                    ? 'Your sample has been collected and sent to the lab. You will receive your report soon.'
                    : 'Your order has been delivered. Thank you for choosing our service!'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </GoogleMapsProvider>
  );
}