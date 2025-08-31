// @ts-nocheck
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Phone, FileText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLabBooking } from '@/hooks/lab-hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';

export function LabBookingSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const { data: booking, isLoading, error } = useLabBooking(bookingId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <ErrorState 
              title="Booking Not Found"
              description="The lab booking you're looking for could not be found."
            />
          </div>
        </div>
      </div>
    );
  }

  const bookingData = {
    ...booking,
    bookingNumber: `LAB-${new Date(booking.created_at).getFullYear()}${booking.id.slice(-6).toUpperCase()}`,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };


  const bookingSteps = [
    { icon: CheckCircle, label: 'Booking Confirmed', completed: true },
    { icon: Calendar, label: 'Sample Collection', completed: false },
    { icon: FileText, label: 'Report Processing', completed: false },
    { icon: FileText, label: 'Report Ready', completed: false },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="text-center mb-8">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
               <h1 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h1>
               <p className="text-muted-foreground mb-4">
                 Your lab test has been scheduled successfully. We will confirm the exact collection time soon.
               </p>
               <div className="bg-muted p-4 rounded-lg">
                 <p className="text-sm text-muted-foreground">Booking ID</p>
                 <p className="text-lg font-mono font-semibold">{bookingData.bookingNumber}</p>
               </div>
            </CardContent>
          </Card>

          {/* Booking Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center relative">
                {bookingSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                        step.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${
                        step.completed ? 'text-green-600 font-medium' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </p>
                      {index < bookingSteps.length - 1 && (
                        <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          step.completed ? 'bg-green-200' : 'bg-muted'
                        }`} style={{ transform: 'translateX(50%)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Test Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{bookingData.test?.name}</h3>
                  <p className="text-sm text-muted-foreground">{bookingData.test?.category}</p>
                  {bookingData.test?.preparation_required && (
                    <Badge variant="secondary" className="mt-1">Fasting Required</Badge>
                  )}
                </div>
                <p className="font-semibold">₹{bookingData.total_amount}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDate(bookingData.booking_date)}</p>
                    <p className="text-sm text-muted-foreground">Collection Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">To be confirmed</p>
                    <p className="text-sm text-muted-foreground">Collection Time</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Report in {bookingData.test?.reporting_time}</p>
                  <p className="text-sm text-muted-foreground">Will be available in your dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Address */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Collection Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{bookingData.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {/* Note: Address data is stored in patient_name and patient_phone only */}
                    Collection address as provided during booking
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">{bookingData.patient_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Our certified phlebotomist will visit your address during the scheduled window</li>
                <li>• You'll receive a call 30 minutes before arrival</li>
                <li>• Please ensure someone is available at the collection address</li>
                <li>• Reports will be available in your dashboard once ready</li>
                <li>• For any queries, contact our support team</li>
                {bookingData.test?.preparation_required && (
                  <li className="text-orange-600 font-medium">
                    • Please maintain fasting as per test requirements
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              Back to Home
            </Button>
            <Button onClick={() => navigate('/')} className="flex-1">
              Book More Tests
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}