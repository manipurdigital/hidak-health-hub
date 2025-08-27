
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Calendar, Clock, Video, MessageSquare, Phone, User, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';
import { useConsultation } from '@/hooks/doctor-hooks';

export function ConsultationSuccessPage() {
  const { consultId } = useParams<{ consultId: string }>();
  const navigate = useNavigate();

  const { data: consultation, isLoading, error, refetch } = useConsultation(consultId!);

  // Auto-refresh every 5 seconds if payment is pending
  React.useEffect(() => {
    if (consultation && consultation.payment_status === 'pending') {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [consultation, refetch]);

  if (isLoading) {
    return <ConsultationSuccessSkeleton />;
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Consultation Not Found"
          description="The consultation you're looking for doesn't exist."
          action={{
            label: "Back to Dashboard",
            onClick: () => navigate('/dashboard')
          }}
        />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getConsultationIcon = () => {
    switch (consultation.consultation_type) {
      case 'audio': return <Phone className="w-5 h-5 text-primary" />;
      case 'video': return <Video className="w-5 h-5 text-primary" />;
      default: return <MessageSquare className="w-5 h-5 text-primary" />;
    }
  };

  const getConsultationLabel = () => {
    switch (consultation.consultation_type) {
      case 'audio': return 'Audio Call';
      case 'video': return 'Video Call';
      default: return 'Text Chat';
    }
  };

  const getPaymentStatusBadge = () => {
    // Only show "Payment Confirmed" if payment_status is 'paid' AND razorpay_payment_id exists
    const isActuallyPaid = consultation.payment_status === 'paid' && consultation.razorpay_payment_id;
    
    if (isActuallyPaid) {
      return <Badge variant="secondary" className="text-green-600 bg-green-50">Payment Confirmed</Badge>;
    } else if (consultation.payment_status === 'pending') {
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Processing Payment</Badge>;
    } else if (consultation.payment_status === 'failed') {
      return <Badge variant="destructive">Payment Failed</Badge>;
    } else {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Payment Required</Badge>;
    }
  };

  const getStatusSteps = () => {
    // Only consider truly paid if payment_status is 'paid' AND razorpay_payment_id exists
    const isPaid = consultation.payment_status === 'paid' && consultation.razorpay_payment_id;
    const isScheduled = consultation.status === 'scheduled';
    
    return [
      { 
        icon: CheckCircle, 
        label: 'Consultation Booked', 
        completed: true 
      },
      { 
        icon: CreditCard, 
        label: 'Payment Confirmed', 
        completed: isPaid 
      },
      { 
        icon: Calendar, 
        label: 'Appointment Scheduled', 
        completed: isPaid && isScheduled 
      },
      { 
        icon: User, 
        label: 'Consultation in Progress', 
        completed: false 
      },
      { 
        icon: CheckCircle, 
        label: 'Consultation Completed', 
        completed: false 
      }
    ];
  };

  const consultationSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="text-center mb-8">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {consultation.payment_status === 'pending' || !(consultation.payment_status === 'paid' && consultation.razorpay_payment_id) ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">
                {consultation.payment_status === 'paid' && consultation.razorpay_payment_id
                  ? 'Consultation Confirmed!' 
                  : 'Consultation Booking Created'
                }
              </h1>
              <p className="text-muted-foreground mb-4">
                {consultation.payment_status === 'paid' && consultation.razorpay_payment_id
                  ? 'Your consultation has been confirmed and scheduled successfully.'
                  : 'Your consultation booking is being processed. Payment confirmation pending.'
                }
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Consultation ID</p>
                <p className="text-lg font-mono font-semibold">{consultation.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          {!(consultation.payment_status === 'paid' && consultation.razorpay_payment_id) && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <CreditCard className="w-5 h-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Current Status:</span>
                  {getPaymentStatusBadge()}
                </div>
                {consultation.payment_status === 'pending' && (
                  <p className="text-sm text-orange-700 mt-2">
                    We're processing your payment. This page will automatically update once confirmed.
                  </p>
                )}
                {consultation.payment_status === 'failed' && (
                  <p className="text-sm text-red-700 mt-2">
                    Payment failed. Please contact support or try booking again.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Consultation Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Consultation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center relative">
                {consultationSteps.map((step, index) => {
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
                      {index < consultationSteps.length - 1 && (
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

          {/* Consultation Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Consultation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Doctor Info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={consultation.doctor?.profile_image_url} alt={consultation.doctor?.full_name} />
                  <AvatarFallback>
                    {consultation.doctor?.full_name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{consultation.doctor?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{consultation.doctor?.specialization}</p>
                </div>
              </div>

              <Separator />

              {/* Appointment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDate(consultation.consultation_date)}</p>
                    <p className="text-sm text-muted-foreground">Consultation Date</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{consultation.time_slot}</p>
                    <p className="text-sm text-muted-foreground">Consultation Time</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getConsultationIcon()}
                <div>
                  <p className="font-medium">{getConsultationLabel()}</p>
                  <p className="text-sm text-muted-foreground">Consultation Mode</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Amount</span>
                <div className="text-right">
                  <Badge variant="secondary" className="text-primary">
                    ₹{consultation.total_amount}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getPaymentStatusBadge()}
                  </div>
                </div>
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
                <li>• You'll receive a reminder notification 15 minutes before your consultation</li>
                <li>• Make sure you have a stable internet connection for video/audio calls</li>
                <li>• Join the consultation room 5 minutes early</li>
                <li>• Have your medical history and current medications ready</li>
                <li>• You can reschedule up to 2 hours before the appointment</li>
                {consultation.payment_status === 'pending' && (
                  <li className="text-orange-600">• Your consultation will be confirmed once payment is processed</li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="flex-1"
            >
              View Dashboard
            </Button>
            <Button 
              onClick={() => navigate(`/consult/${consultId}`)} 
              className="flex-1"
              disabled={!(consultation.payment_status === 'paid' && consultation.razorpay_payment_id)}
            >
              {consultation.payment_status === 'paid' && consultation.razorpay_payment_id
                ? 'Join Consultation Room' 
                : 'Awaiting Payment'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationSuccessSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="text-center">
            <CardContent className="p-8">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto mb-4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
