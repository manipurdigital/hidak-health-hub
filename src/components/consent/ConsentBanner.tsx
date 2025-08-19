import React, { useState, useEffect } from 'react';
import { X, MapPin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConsentBannerProps {
  type: 'location' | 'marketing' | 'cookies';
  onConsent: (granted: boolean) => void;
  onClose: () => void;
}

export function ConsentBanner({ type, onConsent, onClose }: ConsentBannerProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [hasExistingConsent, setHasExistingConsent] = useState(false);

  useEffect(() => {
    checkExistingConsent();
  }, [user, type]);

  const checkExistingConsent = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', type)
      .is('revoked_at', null)
      .single();

    if (data) {
      setHasExistingConsent(true);
      setIsVisible(false);
    }
  };

  const handleConsent = async (granted: boolean) => {
    if (user) {
      await supabase
        .from('user_consents')
        .upsert({
          user_id: user.id,
          kind: type,
          granted_at: granted ? new Date().toISOString() : null,
          revoked_at: granted ? null : new Date().toISOString(),
          meta: { source: 'banner', timestamp: new Date().toISOString() }
        }, {
          onConflict: 'user_id,kind'
        });
    }

    // Store in localStorage for non-authenticated users
    localStorage.setItem(`consent_${type}`, granted.toString());
    
    onConsent(granted);
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || hasExistingConsent) return null;

  const getConsentConfig = () => {
    switch (type) {
      case 'location':
        return {
          icon: <MapPin className="h-5 w-5 text-blue-600" />,
          title: 'Location Access Required',
          description: 'We need your location to assign the nearest collection center and provide accurate delivery estimates. Your location data helps us serve you better.',
          benefits: ['Faster service assignment', 'Accurate delivery times', 'Nearest center allocation'],
          required: true
        };
      case 'marketing':
        return {
          icon: <Mail className="h-5 w-5 text-green-600" />,
          title: 'Marketing Communications',
          description: 'Stay updated with health tips, offers, and new services. You can unsubscribe anytime.',
          benefits: ['Health tips and advice', 'Exclusive offers', 'New service announcements'],
          required: false
        };
      case 'cookies':
        return {
          icon: <span className="text-orange-600">🍪</span>,
          title: 'Cookie Preferences',
          description: 'We use cookies to enhance your experience, analyze usage, and provide personalized content.',
          benefits: ['Better user experience', 'Personalized content', 'Platform improvements'],
          required: false
        };
      default:
        return null;
    }
  };

  const config = getConsentConfig();
  if (!config) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="shadow-lg border border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {config.icon}
              <h3 className="font-semibold text-sm">{config.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleConsent(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {config.description}
          </p>

          <div className="space-y-1 mb-4">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox checked disabled className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex space-x-2">
            {config.required ? (
              <Button 
                onClick={() => handleConsent(true)}
                className="flex-1 text-xs"
                size="sm"
              >
                Allow Access
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleConsent(false)}
                  className="flex-1 text-xs"
                  size="sm"
                >
                  No Thanks
                </Button>
                <Button 
                  onClick={() => handleConsent(true)}
                  className="flex-1 text-xs"
                  size="sm"
                >
                  Accept
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Learn more in our{' '}
            <a href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}