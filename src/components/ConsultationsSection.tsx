
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { CalendarIcon, Star, Clock, Globe, GraduationCap, MapPin, Stethoscope, MessageCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionBenefits from './SubscriptionBenefits';
import { cn } from '@/lib/utils';
import { openRazorpayCheckout, useInitiateConsultationPayment, useConfirmConsultation } from '@/hooks/payment-hooks';

interface Doctor {
  id: string;
  name: string; // Changed from full_name to match database
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  profile_image_url?: string;
  rating?: number; // Made optional
  review_count?: number; // Made optional
  languages?: string[]; // Made optional
  hospital_affiliation?: string; // Made optional
  is_verified: boolean;
  is_available: boolean;
  user_id: string;
  created_at: string;
}

const ConsultationsSection = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedConsultationType, setSelectedConsultationType] = useState('text');
  const [patientNotes, setPatientNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  
  const { user } = useAuth();
  const { hasActiveSubscription, canBookConsultation } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const initiatePayment = useInitiateConsultationPayment();
  const confirmConsultation = useConfirmConsultation();

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  const specialties = [
    'All', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 
    'Gynecology', 'Neurology', 'General Medicine', 'ENT', 'Psychiatry'
  ];

  const consultationTypes = [
    { value: 'text', label: 'Text Chat', icon: MessageCircle },
    { value: 'audio', label: 'Audio Call', icon: MessageCircle },
    { value: 'video', label: 'Video Call', icon: MessageCircle }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, selectedSpecialty, searchTerm]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (selectedSpecialty !== 'All') {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialty);
    }

    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookConsultation = (doctor: Doctor) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a consultation",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    setBookingDoctor(doctor);
  };

  const handleBookingSubmit = async () => {
    if (!bookingDoctor || !selectedDate || !selectedTimeSlot || !user) return;

    setIsBooking(true);
    
    try {
      console.log('Initiating consultation payment...');
      
      const bookingData = {
        doctorId: bookingDoctor.id,
        consultationDate: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedTimeSlot,
        consultationType: selectedConsultationType,
        notes: patientNotes || null
      };

      // Step 1: Initiate payment (creates Razorpay order)
      const paymentData = await initiatePayment.mutateAsync(bookingData);
      console.log('Payment initiated:', paymentData);

      // Step 2: Open Razorpay checkout immediately
      openRazorpayCheckout({
        key: paymentData.key_id,
        amount: Math.round(paymentData.amount * 100), // Convert to paise
        currency: 'INR',
        name: 'MediCare Consultation',
        description: `Consultation with ${paymentData.doctor_name}`,
        order_id: paymentData.order_id,
        handler: async (response: any) => {
          console.log('Payment successful:', response);
          
          try {
            // Step 3: Confirm consultation after payment success
            const confirmationData = await confirmConsultation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ...bookingData
            });

            console.log('Consultation confirmed:', confirmationData);
            
            // Navigate to success page with consultation ID
            navigate(`/consult-success/${confirmationData.consultation_id}`);
            
            // Clean up form
            setBookingDoctor(null);
            setSelectedDate(undefined);
            setSelectedTimeSlot('');
            setSelectedConsultationType('text');
            setPatientNotes('');

          } catch (confirmError) {
            console.error('Error confirming consultation:', confirmError);
            toast({
              title: "Confirmation Failed",
              description: "Payment was successful but consultation confirmation failed. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment cancelled/dismissed');
            toast({
              title: "Payment Cancelled",
              description: "No booking was created. Please try again when ready.",
              variant: "destructive"
            });
          }
        }
      });

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Consult with Doctors</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Book online consultations with verified doctors. Pay first to confirm your booking instantly.
          </p>
        </div>

        {/* Subscription Benefits */}
        <SubscriptionBenefits className="mb-8" />

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search doctors by name, specialty, or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-48">
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  {doctor.profile_image_url ? (
                    <img 
                      src={doctor.profile_image_url} 
                      alt={doctor.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Stethoscope className="w-10 h-10 text-primary" />
                  )}
                </div>
                <CardTitle className="text-xl">{doctor.name}</CardTitle>
                <Badge variant="secondary" className="mx-auto">
                  {doctor.specialization}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{(doctor.rating ?? 0).toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">({doctor.review_count ?? 0} reviews)</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span>{doctor.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{doctor.experience_years} years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{doctor.hospital_affiliation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{doctor.languages ? doctor.languages.join(', ') : 'Not specified'}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{doctor.bio}</p>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium">Consultation Fee</span>
                    <div className="text-right">
                      {hasActiveSubscription ? (
                        <div>
                          <span className="text-lg font-bold text-green-600">FREE</span>
                          <p className="text-xs text-muted-foreground line-through">₹{doctor.consultation_fee}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-lg font-bold text-primary">₹{doctor.consultation_fee}</span>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CreditCard className="w-3 h-3" />
                            Prepaid only
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleBookConsultation(doctor)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Book Consultation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Booking Modal */}
        {bookingDoctor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Book Consultation with {bookingDoctor.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Payment will be processed immediately to confirm your booking
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{bookingDoctor.specialization}</span>
                    <div className="text-right">
                      {hasActiveSubscription ? (
                        <div>
                          <span className="text-lg font-bold text-green-600">FREE</span>
                          <p className="text-xs text-muted-foreground line-through">₹{bookingDoctor.consultation_fee}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-lg font-bold text-primary">₹{bookingDoctor.consultation_fee}</span>
                           <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            Pay now
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Consultation Type</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {consultationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={selectedConsultationType === type.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedConsultationType(type.value)}
                          className="text-xs flex flex-col gap-1 h-auto py-2"
                        >
                          <Icon className="w-4 h-4" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Select Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium">Select Time Slot</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className="text-xs"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Describe your symptoms (Optional)</label>
                  <Textarea
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    placeholder="Briefly describe your symptoms or reason for consultation..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setBookingDoctor(null);
                      setSelectedDate(undefined);
                      setSelectedTimeSlot('');
                      setSelectedConsultationType('text');
                      setPatientNotes('');
                    }}
                    disabled={isBooking}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleBookingSubmit}
                    disabled={!selectedDate || !selectedTimeSlot || isBooking}
                  >
                    {isBooking ? (
                      <>Processing Payment...</>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay & Book Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConsultationsSection;
