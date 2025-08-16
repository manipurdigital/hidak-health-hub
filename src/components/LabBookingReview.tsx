import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCreateLabBooking } from '@/hooks/api-hooks';
import { useToast } from '@/hooks/use-toast';

interface LabBookingReviewProps {
  labTest: any;
  slot: { date: string; time: string; datetime: string };
  selectedAddress: string;
  addresses: any[];
  onBack: () => void;
}

export function LabBookingReview({ 
  labTest, 
  slot, 
  selectedAddress, 
  addresses, 
  onBack 
}: LabBookingReviewProps) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isBooking, setIsBooking] = useState(false);
  const createLabBooking = useCreateLabBooking();
  const { toast } = useToast();

  const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
  
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

  const handleConfirmBooking = async () => {
    if (!selectedAddr) {
      toast({
        title: "Address Error",
        description: "Selected address not found.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const bookingData = {
        test_id: labTest.id,
        booking_date: slot.date,
        time_slot: slot.time,
        patient_name: selectedAddr.name,
        patient_phone: selectedAddr.phone,
        patient_email: '', // Will be filled from user profile
        total_amount: labTest.price,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid', // Simulate payment for MVP
        special_instructions: labTest.preparation_required 
          ? 'Patient requires fasting as per test requirements.' 
          : undefined,
      };

      const result = await createLabBooking.mutateAsync(bookingData);
      
      navigate(`/lab-booking-success/${result.id}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
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

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatTime(slot.time)}</p>
                <p className="text-sm text-muted-foreground">Collection Time</p>
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