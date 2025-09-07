import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Phone, MessageCircle } from 'lucide-react';

const ServiceRequestSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('id');
  const services = searchParams.get('services')?.split(',') || [];

  const whatsappNumber = '918794265302'; // From env or config

  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Hi! I just submitted a service request (ID: ${requestId}). I have some questions about my order.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">Request Submitted Successfully!</CardTitle>
          <p className="text-muted-foreground">
            Your service request has been received and is being processed
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {requestId && (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Request ID</p>
              <p className="text-lg font-mono font-bold">{requestId}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Please save this ID for future reference
              </p>
            </div>
          )}

          {services.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Services Requested:</h3>
              <div className="flex flex-wrap gap-2">
                {services.map((service, index) => (
                  <Badge key={index} variant="outline">{service}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our team will review your request within 2 hours</li>
              <li>• We'll contact you on the provided phone number</li>
              <li>• You'll receive pricing and availability details</li>
              <li>• We'll arrange delivery/pickup as per your preference</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            
            <Button
              onClick={handleContactSupport}
              className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need immediate assistance? Call us at{' '}
              <a href="tel:+918794265302" className="text-primary font-semibold">
                +91 8794 265 302
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceRequestSuccessPage;