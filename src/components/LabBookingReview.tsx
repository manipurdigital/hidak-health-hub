import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateLabBooking } from '@/hooks/api-hooks';
import { openRazorpayCheckout, useVerifyPayment } from '@/hooks/payment-hooks';
import { useToast } from '@/hooks/use-toast';
import { checkServiceability, ServiceabilityResult } from '@/services/serviceability';

interface LabBookingReviewProps {
  labTest: any;
  slot: { date: string; time: string; datetime: string; notes?: string };
  selectedAddress: string;
  addresses: any[];
  locationData: { lat: number; lng: number; address: any };
  onBack: () => void;
}

export function LabBookingReview({ 
  labTest, 
  slot, 
  selectedAddress, 
  addresses, 
  locationData,
  onBack 
}: LabBookingReviewProps) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isBooking, setIsBooking] = useState(false);
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);
const createLabBooking = useCreateLabBooking();
const verifyPayment = useVerifyPayment();
const { toast } = useToast();

  const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
  
  
  // Check serviceability when address is available
  useEffect(() => {
    const checkAddressServiceability = async () => {
      if (selectedAddr?.latitude && selectedAddr?.longitude) {
        setCheckingServiceability(true);
        try {
          const result = await checkServiceability(
            'lab',
            selectedAddr.latitude,
            selectedAddr.longitude
          );
          setServiceability(result);
        } catch (error) {
          console.error('Error checking serviceability:', error);
        } finally {
          setCheckingServiceability(false);
        }
      } else {
        setServiceability(null);
      }
    };

    checkAddressServiceability();
  }, [selectedAddr]);

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
    // Support both single time (e.g., "09:00") and range (e.g., "09:00 - 11:00")
    if (timeString.includes(' - ')) {
      const [start, end] = timeString.split(' - ').map((s) => s.trim());
      return { start, end, display: `${start} - ${end}` };
    }
    const [hour, minute = '00'] = timeString.split(':');
    const hourNum = parseInt(hour);
    const endHour = (hourNum + 2) % 24;
    const start = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    const end = `${endHour.toString().padStart(2, '0')}:${minute}`;
    return { start, end, display: `${start} - ${end}` };
  };
  const handleConfirmBooking = async () => {
    if (!selectedAddr) {
      toast({
        title: "Address Error",
        description: "Selected address not found.",
        variant: "destructive",
      });
      return;
    }

    // Check serviceability before booking
    if (serviceability && !serviceability.isServiceable) {
      toast({
        title: "Service Not Available",
        description: serviceability.error || "Lab collection not available in your area",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const timeWindow = formatTime(slot.time);
      
      const bookingData: any = {
        testId: labTest.id,
        bookingDate: slot.date,
        timeSlot: slot.time,
        patientName: locationData.address.name || selectedAddr?.name || '',
        patientPhone: locationData.address.phone || selectedAddr?.phone || '',
        patientEmail: '', // Will be filled from user profile on backend
        specialInstructions: slot.notes || (labTest.preparation_required 
          ? 'Patient requires fasting as per test requirements.' 
          : undefined),
        pickupLat: locationData.lat,
        pickupLng: locationData.lng,
        pickupAddress: locationData.address
      };

      // Add assigned center if available
      if (serviceability?.center) {
        bookingData.center_id = serviceability.center.id;
      }

      const result = await createLabBooking.mutateAsync(bookingData);

      if (paymentMethod === 'razorpay') {
        // Open Razorpay checkout and navigate only on success
        setIsBooking(false);
        openRazorpayCheckout({
          key: result.razorpay_key_id,
          amount: labTest.price * 100,
          currency: 'INR',
          name: 'Lab Test Booking',
          description: `${labTest.name} - ${formatDate(slot.date)} (${formatTime(slot.time).display})`,
          order_id: result.razorpay_order_id,
          handler: async (response: any) => {
            try {
              await verifyPayment.mutateAsync({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              navigate(`/lab-booking/success/${result.id}`);
            } catch (e) {
              toast({
                title: 'Payment Verification Failed',
                description: 'We could not verify your payment. Please contact support.',
                variant: 'destructive',
              });
            }
          },
          prefill: {
            name: selectedAddr.name,
            contact: selectedAddr.phone,
            email: undefined,
          },
          theme: { color: '#06b6d4' },
          modal: {
            ondismiss: () => {
              toast({
                title: 'Payment Cancelled',
                description: 'You dismissed the payment. You can try again.',
                variant: 'destructive',
              });
            },
          },
        });
      } else {
        // Pay Later
        navigate(`/lab-booking/success/${result.id}`);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Details */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{labTest.name}</h3>
              {labTest.category && (
                <p className="text-sm text-muted-foreground">{labTest.category}</p>
              )}
              {labTest.preparation_required && (
                <Badge variant="secondary" className="mt-1 bg-orange-100 text-orange-800">
                  Fasting Required
                </Badge>
              )}
            </div>
            <p className="font-semibold text-lg">₹{labTest.price}</p>
          </div>

          <Separator />

          {/* Appointment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatDate(slot.date)}</p>
                <p className="text-sm text-muted-foreground">Collection Date</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedAddr?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedAddr?.address_line_1}, {selectedAddr?.address_line_2 && `${selectedAddr.address_line_2}, `}
                  {selectedAddr?.city}, {selectedAddr?.state} - {selectedAddr?.postal_code}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: {selectedAddr?.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Serviceability Status */}
          {checkingServiceability && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Checking sample collection availability for your area...
              </AlertDescription>
            </Alert>
          )}
          
          {serviceability && (
            <Alert className={`mt-4 ${serviceability.isServiceable ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
              {serviceability.isServiceable ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {serviceability.isServiceable ? (
                  <div>
                    <span className="text-green-800 font-medium">✓ Collection Available</span>
                    {serviceability.center && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Serviceable by: {serviceability.center.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-red-800 font-medium">
                    {serviceability.error || "Sample collection not available in your area"}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(value: 'razorpay' | 'cod') => setPaymentMethod(value)}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="razorpay" id="razorpay" />
                <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="font-medium">Online Payment</div>
                    <p className="text-sm text-muted-foreground">
                      Pay securely using UPI, Cards, Net Banking
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="font-medium">Pay Later</div>
                    <p className="text-sm text-muted-foreground">
                      Pay when the sample is collected
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Total */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span>₹{labTest.price}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            * Additional home collection charges applicable. One of our lab partner will call you & confirm the order.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Slots
        </Button>
        <Button 
          onClick={handleConfirmBooking}
          disabled={isBooking}
          className="flex-1"
          size="lg"
        >
          {isBooking ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
}