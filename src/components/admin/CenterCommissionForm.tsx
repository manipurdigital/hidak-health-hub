import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface CenterCommissionFormProps {
  centerId: string;
  centerName: string;
  currentRate: number;
}

export function CenterCommissionForm({ centerId, centerName, currentRate }: CenterCommissionFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Commission Settings - {centerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Commission management functionality is being updated.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current rate: {Math.round(currentRate * 100)}%
          </p>
          <Badge variant="secondary" className="mt-4">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}