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

  // For MVP, show mock data since we're simulating the booking
  const mockBookingData = {
    id: bookingId,
    bookingNumber: `LAB-${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
    status: 'confirmed',
    test: {
      name: 'Complete Blood Count (CBC)',
      category: 'Blood Test',
      preparation_required: false,
      reporting_time: '24 hours'
    },
    booking_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time_slot: '09:00',
    patient_name: 'John Doe',
    patient_phone: '+91 98765 43210',
    total_amount: 350,
    collection_address: {
      name: 'John Doe',
      address: '123 Main St, Apartment 4B',
      city: 'Mumbai',
      postalCode: '400001',
      phone: '+91 98765 43210'
    },
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

  const formatTime = (timeString: string) => {
    const [hour] = timeString.split(':');
    const hourNum = parseInt(hour);
    const endHour = hourNum + 2;
    return `${timeString} - ${endHour.toString().padStart(2, '0')}:00`;
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
                Your lab test has been scheduled successfully. Our technician will visit your location.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="text-lg font-mono font-semibold">{mockBookingData.bookingNumber}</p>
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
                  <h3 className="font-semibold">{mockBookingData.test.name}</h3>
                  <p className="text-sm text-muted-foreground">{mockBookingData.test.category}</p>
                  {mockBookingData.test.preparation_required && (
                    <Badge variant="secondary" className="mt-1">Fasting Required</Badge>
                  )}
                </div>
                <p className="font-semibold">₹{mockBookingData.total_amount}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDate(mockBookingData.booking_date)}</p>
                    <p className="text-sm text-muted-foreground">Collection Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatTime(mockBookingData.time_slot)}</p>
                    <p className="text-sm text-muted-foreground">Collection Time</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Report in {mockBookingData.test.reporting_time}</p>
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
                  <p className="font-medium">{mockBookingData.collection_address.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockBookingData.collection_address.address}<br />
                    {mockBookingData.collection_address.city} - {mockBookingData.collection_address.postalCode}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">{mockBookingData.collection_address.phone}</p>
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
                <li>• Our technician will call you 30 minutes before the scheduled time</li>
                <li>• Please ensure someone is available at the collection address</li>
                <li>• Reports will be available in your dashboard once ready</li>
                <li>• For any queries, contact our support team</li>
                {mockBookingData.test.preparation_required && (
                  <li className="text-orange-600 font-medium">
                    • Please maintain fasting as per test requirements
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
              View Dashboard
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