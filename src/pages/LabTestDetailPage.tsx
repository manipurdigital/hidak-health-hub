import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLabTest } from '@/hooks/lab-hooks';
import { useAddresses } from '@/hooks/medicine-hooks';
import { SlotPicker } from '@/components/SlotPicker';
import { LabBookingReview } from '@/components/LabBookingReview';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';

type BookingStep = 'details' | 'slot' | 'review';

export function LabTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
    datetime: string;
  } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const { data: labTest, isLoading, error } = useLabTest(id!);
  const { data: addresses = [] } = useAddresses();

  if (isLoading) {
    return <LabTestDetailSkeleton />;
  }

  if (error || !labTest) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Lab Test Not Found"
          description="The lab test you're looking for doesn't exist or is unavailable."
          action={{
            label: "Back to Search",
            onClick: () => navigate(-1)
          }}
        />
      </div>
    );
  }

  const handleBookNow = () => {
    setCurrentStep('slot');
  };

  const handleSlotSelected = (slot: { date: string; time: string; datetime: string }) => {
    setSelectedSlot(slot);
    setCurrentStep('review');
  };

  const handleBackToSlots = () => {
    setCurrentStep('slot');
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
    setSelectedSlot(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => currentStep === 'details' ? navigate(-1) : handleBackToDetails()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 'details' ? 'Back' : 'Back to Details'}
        </Button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${currentStep === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Details</span>
            </div>
            <div className="w-8 h-px bg-muted" />
            <div className={`flex items-center ${currentStep === 'slot' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === 'slot' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Slot</span>
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

        {currentStep === 'details' && (
          <LabTestDetails 
            labTest={labTest} 
            onBookNow={handleBookNow}
          />
        )}

        {currentStep === 'slot' && (
          <SlotPicker
            labTest={labTest}
            addresses={addresses}
            selectedAddress={selectedAddress}
            onAddressChange={setSelectedAddress}
            onSlotSelected={handleSlotSelected}
            onBack={handleBackToDetails}
          />
        )}

        {currentStep === 'review' && selectedSlot && (
          <LabBookingReview
            labTest={labTest}
            slot={selectedSlot}
            selectedAddress={selectedAddress}
            addresses={addresses}
            onBack={handleBackToSlots}
          />
        )}
      </div>
    </div>
  );
}

function LabTestDetails({ labTest, onBookNow }: { 
  labTest: any; 
  onBookNow: () => void; 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Test Image */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              {labTest.image_url ? (
                <img
                  src={labTest.image_url}
                  alt={labTest.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-2" />
                  <p>Lab Test</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Features */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-xs">Home Collection</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-xs">{labTest.reporting_time || '24 hrs'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Details */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{labTest.name}</CardTitle>
                {labTest.category && (
                  <p className="text-muted-foreground mt-1">{labTest.category}</p>
                )}
              </div>
              {labTest.preparation_required && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  Fasting Required
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">₹{labTest.price}</span>
            </div>

            {/* Sample Type & Reporting Time */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {labTest.sample_type && <span>Sample: {labTest.sample_type}</span>}
              {labTest.reporting_time && <span>Report: {labTest.reporting_time}</span>}
            </div>

            <Separator />

            {/* Description */}
            {labTest.description && (
              <div>
                <h3 className="font-semibold mb-2">About This Test</h3>
                <p className="text-muted-foreground">{labTest.description}</p>
              </div>
            )}

            {/* Fasting Instructions */}
            {labTest.preparation_required && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fasting Required:</strong> Please fast for 8-12 hours before sample collection. 
                  You may drink water during this period.
                </AlertDescription>
              </Alert>
            )}

            {/* Book Button */}
            <Button onClick={onBookNow} size="lg" className="w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Book Test
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LabTestDetailSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-24 mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="aspect-square w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}