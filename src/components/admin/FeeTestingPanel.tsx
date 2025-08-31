import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator } from 'lucide-react';

export function FeeTestingPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Fee Testing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Fee testing functionality is being updated.</p>
          <Badge variant="secondary" className="mt-4">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}