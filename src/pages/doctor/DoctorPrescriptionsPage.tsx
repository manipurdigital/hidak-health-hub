import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar } from 'lucide-react';

export default function DoctorPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground">Manage and view all prescriptions</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Prescriptions Module</h3>
          <p className="text-muted-foreground">
            This section will contain all prescription management features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}