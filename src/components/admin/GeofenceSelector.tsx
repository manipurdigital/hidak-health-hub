import React from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
  serviceType: "delivery" | "lab_collection";
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function GeofenceSelector({ serviceType, value, onChange, disabled }: Props) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Geofencing functionality is being updated.</p>
      <Badge variant="secondary" className="mt-4">
        Coming Soon
      </Badge>
    </div>
  );
}