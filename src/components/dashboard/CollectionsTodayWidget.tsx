import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

export function CollectionsTodayWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Collections Today
        </CardTitle>
        <CardDescription>
          Today's lab collection performance overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <p className="text-2xl font-bold">₹0</p>
          <p className="text-sm text-muted-foreground">Collections tracking</p>
          <Badge variant="secondary" className="mt-2">
            Coming Soon
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}