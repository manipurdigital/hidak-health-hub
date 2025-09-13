import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Mic, Volume2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PermissionGateProps {
  onPermissionsGranted: () => void;
  requiredPermissions?: ('camera' | 'microphone' | 'notifications')[];
  children?: React.ReactNode;
}

export function PermissionGate({ 
  onPermissionsGranted, 
  requiredPermissions = ['camera', 'microphone', 'notifications'],
  children 
}: PermissionGateProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Record<string, PermissionState | 'unknown'>>({});
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermissions = async () => {
    const results: Record<string, PermissionState | 'unknown'> = {};

    try {
      if (requiredPermissions.includes('camera')) {
        const cameraResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        results.camera = cameraResult.state;
      }

      if (requiredPermissions.includes('microphone')) {
        const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        results.microphone = micResult.state;
      }

      if (requiredPermissions.includes('notifications')) {
        if ('Notification' in window) {
          results.notifications = Notification.permission as PermissionState;
        } else {
          results.notifications = 'denied';
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      // Fallback to unknown state
      requiredPermissions.forEach(perm => {
        results[perm] = 'unknown';
      });
    }

    setPermissions(results);
    return results;
  };

  const requestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      // Request media permissions
      if (requiredPermissions.includes('camera') || requiredPermissions.includes('microphone')) {
        const constraints: MediaStreamConstraints = {};
        
        if (requiredPermissions.includes('camera')) {
          constraints.video = true;
        }
        
        if (requiredPermissions.includes('microphone')) {
          constraints.audio = true;
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Stop the stream immediately after getting permission
          stream.getTracks().forEach(track => track.stop());
          
          toast({
            title: "Media Access Granted",
            description: "Camera and microphone permissions approved",
          });
        } catch (mediaError) {
          console.error('Media permission error:', mediaError);
          toast({
            title: "Media Access Denied",
            description: "Please allow camera and microphone access in your browser settings",
            variant: "destructive",
          });
          throw mediaError;
        }
      }

      // Request notification permission
      if (requiredPermissions.includes('notifications') && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const notificationPermission = await Notification.requestPermission();
          
          if (notificationPermission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive call notifications",
            });
          }
        }
      }

      // Recheck permissions after requests
      const updatedPermissions = await checkPermissions();
      
      // Check if all required permissions are granted
      const allGranted = requiredPermissions.every(perm => 
        updatedPermissions[perm] === 'granted'
      );

      if (allGranted) {
        onPermissionsGranted();
      }

    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const allPermissionsGranted = requiredPermissions.every(perm => 
    permissions[perm] === 'granted'
  );

  const getPermissionIcon = (permission: string, state: PermissionState | 'unknown') => {
    const IconComponent = permission === 'camera' ? Camera : 
                         permission === 'microphone' ? Mic : Volume2;
    
    const iconColor = state === 'granted' ? 'text-green-600' : 
                     state === 'denied' ? 'text-red-600' : 'text-yellow-600';
    
    return <IconComponent className={`w-5 h-5 ${iconColor}`} />;
  };

  const getPermissionStatus = (state: PermissionState | 'unknown') => {
    switch (state) {
      case 'granted':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'denied':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (allPermissionsGranted) {
    return <>{children}</>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Permissions Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This application needs access to your device to provide call functionality.
        </p>

        <div className="space-y-3">
          {requiredPermissions.map(permission => (
            <div key={permission} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {getPermissionIcon(permission, permissions[permission] || 'unknown')}
                <span className="font-medium capitalize">{permission}</span>
              </div>
              {getPermissionStatus(permissions[permission] || 'unknown')}
            </div>
          ))}
        </div>

        <Button 
          onClick={requestPermissions} 
          disabled={isRequesting}
          className="w-full"
        >
          {isRequesting ? 'Requesting Permissions...' : 'Grant Permissions'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Click "Grant Permissions" and allow access when prompted by your browser.
        </p>
      </CardContent>
    </Card>
  );
}