import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConsentBannerProps {
  type: 'location' | 'marketing' | 'cookies';
  onConsent: (granted: boolean) => void;
  onClose: () => void;
}

export function ConsentBanner({ type, onConsent, onClose }: ConsentBannerProps) {
  return (
    <Card className="border-muted">
      <CardContent className="p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Consent management system</p>
          <Badge variant="outline" className="mt-2">
            Privacy Ready
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}