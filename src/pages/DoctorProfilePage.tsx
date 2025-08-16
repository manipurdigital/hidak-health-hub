import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Languages, MapPin, Calendar, Clock, Video, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDoctor, useDoctorAvailability, useAvailableSlots } from '@/hooks/doctor-hooks';
import { useCreateConsultation } from '@/hooks/api-hooks';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';

type BookingStep = 'profile' | 'slot' | 'mode' | 'review';
type ConsultationType = 'text' | 'audio' | 'video';

export function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasActiveSubscription } = useSubscription();
  const createConsultation = useCreateConsultation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<BookingStep>('profile');
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    datetime: string;
  } | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>('text');
  const [isBooking, setIsBooking] = useState(false);

  const { data: doctor, isLoading, error } = useDoctor(id!);
  const { data: availability = [] } = useDoctorAvailability(id!);
  const { data: availableSlots = [] } = useAvailableSlots(id!, availability);

  if (isLoading) {
    return <DoctorProfileSkeleton />;
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Doctor Not Found"
          description="The doctor you're looking for doesn't exist or is unavailable."
          action={{
            label: "Back to Search",
            onClick: () => navigate(-1)
          }}
        />
      </div>
    );
  }

  const handleBookConsultation = () => {
    setCurrentStep('slot');
  };

  const handleSlotSelected = (slot: { date: string; time: string; datetime: string }) => {
    setSelectedSlot(slot);
    setCurrentStep('mode');
  };

  const handleModeSelected = () => {
    setCurrentStep('review');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);

    try {
      const consultationData = {
        doctor_id: doctor.id,
        consultation_date: selectedSlot.date,
        time_slot: selectedSlot.time,
        consultation_type: consultationType,
        total_amount: hasActiveSubscription ? 0 : doctor.consultation_fee,
        payment_status: hasActiveSubscription ? 'waived' : 'paid', // Simulate payment
        patient_notes: '',
      };

      const result = await createConsultation.mutateAsync(consultationData);
      navigate(`/consult-success/${result.id}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'slot':
        setCurrentStep('profile');
        break;
      case 'mode':
        setCurrentStep('slot');
        break;
      case 'review':
        setCurrentStep('mode');
        break;
      default:
        navigate(-1);
    }
  };

  const formatPrice = () => {
    if (hasActiveSubscription) {
      return <span className="text-green-600 font-semibold">Free with Care+</span>;
    }
    return <span className="text-primary font-semibold">₹{doctor.consultation_fee}</span>;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Progress Steps */}
        {currentStep !== 'profile' && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm">Slot</span>
              </div>
              <div className="w-8 h-px bg-muted" />
              <div className={`flex items-center ${currentStep === 'mode' || currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'mode' || currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm">Mode</span>
              </div>
              <div className="w-8 h-px bg-muted" />
              <div className={`flex items-center ${currentStep === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <span className="ml-2 text-sm">Review</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'profile' && (
          <DoctorProfile doctor={doctor} onBookConsultation={handleBookConsultation} formatPrice={formatPrice} />
        )}

        {currentStep === 'slot' && (
          <AvailabilityPicker
            doctor={doctor}
            availableSlots={availableSlots}
            onSlotSelected={handleSlotSelected}
          />
        )}

        {currentStep === 'mode' && (
          <ConsultationMode
            consultationType={consultationType}
            onTypeChange={setConsultationType}
            onContinue={handleModeSelected}
          />
        )}

        {currentStep === 'review' && selectedSlot && (
          <ConsultationReview
            doctor={doctor}
            slot={selectedSlot}
            consultationType={consultationType}
            hasActiveSubscription={hasActiveSubscription}
            isBooking={isBooking}
            onConfirm={handleConfirmBooking}
          />
        )}
      </div>
    </div>
  );
}

function DoctorProfile({ doctor, onBookConsultation, formatPrice }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Doctor Image */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={doctor.profile_image_url} alt={doctor.full_name} />
                <AvatarFallback className="text-2xl">
                  {doctor.full_name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{doctor.full_name}</h2>
              <p className="text-muted-foreground">{doctor.qualification}</p>
              
              {doctor.rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{doctor.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({doctor.review_count} reviews)
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Specialization */}
            <div>
              <h3 className="font-semibold mb-2">Specialization</h3>
              <Badge variant="secondary">{doctor.specialization}</Badge>
            </div>

            {/* Experience */}
            {doctor.experience_years && (
              <div>
                <h3 className="font-semibold mb-2">Experience</h3>
                <p className="text-muted-foreground">{doctor.experience_years} years</p>
              </div>
            )}

            {/* Languages */}
            {doctor.languages && doctor.languages.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Languages</h3>
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {doctor.languages.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Hospital */}
            {doctor.hospital_affiliation && (
              <div>
                <h3 className="font-semibold mb-2">Hospital</h3>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{doctor.hospital_affiliation}</span>
                </div>
              </div>
            )}

            {/* Bio */}
            {doctor.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{doctor.bio}</p>
              </div>
            )}

            <Separator />

            {/* Consultation Fee */}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Consultation Fee</span>
              {formatPrice()}
            </div>

            {/* Book Button */}
            <Button onClick={onBookConsultation} size="lg" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AvailabilityPicker({ doctor, availableSlots, onSlotSelected }: any) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc: any, slot: any) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(slotsByDate).sort();

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const selectedSlot = availableSlots.find(
        (slot: any) => slot.date === selectedDate && slot.time === selectedTime
      );
      if (selectedSlot) {
        onSlotSelected(selectedSlot);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Available Slot for Dr. {doctor.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selection */}
          <div>
            <h3 className="font-semibold mb-3">Select Date</h3>
            <div className="grid grid-cols-5 gap-2">
              {dates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? "default" : "outline"}
                  className="h-16 flex flex-col items-center"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                >
                  <span className="text-xs">{formatDate(date).split(' ')[0]}</span>
                  <span className="text-sm font-semibold">{formatDate(date).split(' ')[2]}</span>
                  <span className="text-xs">{formatDate(date).split(' ')[1]}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <h3 className="font-semibold mb-3">Select Time</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {slotsByDate[selectedDate]?.map((slot: any) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    className="h-10"
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <Button onClick={handleContinue} className="w-full" size="lg">
              Continue to Select Mode
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultationMode({ consultationType, onTypeChange, onContinue }: any) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Select Consultation Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={consultationType} onValueChange={onTypeChange}>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex-1 cursor-pointer">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Text Chat</div>
                        <p className="text-sm text-muted-foreground">
                          Chat with the doctor via text messages
                        </p>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="audio" id="audio" />
                <Label htmlFor="audio" className="flex-1 cursor-pointer">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Audio Call</div>
                        <p className="text-sm text-muted-foreground">
                          Voice consultation with the doctor
                        </p>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex-1 cursor-pointer">
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-medium">Video Call</div>
                        <p className="text-sm text-muted-foreground">
                          Face-to-face consultation with the doctor
                        </p>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <Button onClick={onContinue} className="w-full" size="lg">
            Continue to Review
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ConsultationReview({ doctor, slot, consultationType, hasActiveSubscription, isBooking, onConfirm }: any) {
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
    switch (consultationType) {
      case 'audio': return <Phone className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getConsultationLabel = () => {
    switch (consultationType) {
      case 'audio': return 'Audio Call';
      case 'video': return 'Video Call';
      default: return 'Text Chat';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consultation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Doctor Info */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={doctor.profile_image_url} alt={doctor.full_name} />
              <AvatarFallback>
                {doctor.full_name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{doctor.full_name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            </div>
          </div>

          <Separator />

          {/* Appointment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{formatDate(slot.date)}</p>
                <p className="text-sm text-muted-foreground">at {slot.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getConsultationIcon()}
              <div>
                <p className="font-medium">{getConsultationLabel()}</p>
                <p className="text-sm text-muted-foreground">Consultation Mode</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span>
              {hasActiveSubscription ? (
                <span className="text-green-600">Free with Care+</span>
              ) : (
                `₹${doctor.consultation_fee}`
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={onConfirm}
        disabled={isBooking}
        className="w-full"
        size="lg"
      >
        {isBooking ? 'Booking...' : 'Confirm Consultation'}
      </Button>
    </div>
  );
}

function DoctorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-24 mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-32 h-32 rounded-full mb-4" />
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}