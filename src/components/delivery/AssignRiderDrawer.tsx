import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';

interface AssignRiderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrderNumber?: string;
}

export function AssignRiderDrawer({ open, onOpenChange, initialOrderNumber = '' }: AssignRiderDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assign Rider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Rider assignment functionality is being updated.</p>
            <Badge variant="secondary" className="mt-4">
              Coming Soon
            </Badge>
          </div>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full mt-4"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}