import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CenterLayout } from '@/components/CenterLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TestTube, Package } from 'lucide-react';
import { TrackingMap } from '@/components/tracking/TrackingMap';
import { useCenterJobs } from '@/hooks/tracking-hooks';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';

export default function CenterJobTrackingPage() {
  const { type, id } = useParams<{ type: 'lab' | 'delivery'; id: string }>();
  
  const { data: labJobs } = useCenterJobs('lab');
  const { data: deliveryJobs } = useCenterJobs('delivery');

  if (!type || !id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Invalid job parameters</h2>
        </div>
      </div>
    );
  }

  const jobs = type === 'lab' ? labJobs : deliveryJobs;
  const job = jobs?.find(j => j.id === id);

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Job not found</h2>
          <Button asChild className="mt-4">
            <Link to="/center/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapsProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/center/jobs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {type === 'lab' ? (
                <TestTube className="h-8 w-8" />
              ) : (
                <Package className="h-8 w-8" />
              )}
              Track {type === 'lab' ? 'Lab Collection' : 'Medicine Delivery'}
            </h1>
            <p className="text-muted-foreground">
              Live tracking for {job.customer_name}
            </p>
          </div>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Job Details
              <Badge className={`${
                job.status === 'collected' || job.status === 'delivered' 
                  ? 'bg-green-500' 
                  : job.status === 'en_route' || job.status === 'out_for_delivery'
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              } text-white`}>
                {job.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Customer</h4>
              <p>{job.customer_name}</p>
            </div>
            <div>
              <h4 className="font-semibold">Destination</h4>
              <p>{job.destination_address}</p>
            </div>
            {type === 'lab' && 'test_name' in job && (
              <div>
                <h4 className="font-semibold">Test</h4>
                <p>{job.test_name}</p>
              </div>
            )}
            {job.tracking_token && (
              <div>
                <h4 className="font-semibold">Tracking Link</h4>
                <p className="text-sm text-muted-foreground">
                  {window.location.origin}/track/{type}/{job.id}/{job.tracking_token}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Map */}
        <TrackingMap
          jobType={type}
          jobId={job.id}
          centerId="center-123" // This should come from user context
          centerType={type}
          destinationAddress={job.destination_address}
          customerName={job.customer_name}
          etaMinutes={job.last_eta_mins}
          distanceMeters={job.last_distance_meters}
          isStaff={true}
        />
      </div>
    </GoogleMapsProvider>
  );
}