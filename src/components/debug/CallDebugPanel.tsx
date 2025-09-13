import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCall } from '@/hooks/use-call';

interface CallDebugPanelProps {
  consultationId?: string;
}

export function CallDebugPanel({ consultationId }: CallDebugPanelProps) {
  const { activeCall, isLoading } = useCall(consultationId);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 opacity-90">
      <CardHeader>
        <CardTitle className="text-sm">Call Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Consultation ID:</span>
          <span className="text-xs font-mono">{consultationId || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Active Call:</span>
          <Badge variant={activeCall ? 'default' : 'secondary'} className="text-xs">
            {activeCall ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        {activeCall && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Call Status:</span>
              <Badge 
                variant={
                  activeCall.status === 'active' ? 'default' :
                  activeCall.status === 'ringing' ? 'secondary' :
                  'destructive'
                }
                className="text-xs"
              >
                {activeCall.status}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Call ID:</span>
              <span className="text-xs font-mono">{activeCall.id.slice(0, 8)}...</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Loading:</span>
          <Badge variant={isLoading ? 'secondary' : 'outline'} className="text-xs">
            {isLoading ? 'Yes' : 'No'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}