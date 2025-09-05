import React, { useEffect, useRef } from 'react';
import { IncomingCall } from '@/components/IncomingCall';
import { useCall } from '@/hooks/use-call';
import { useCallNotifications } from '@/hooks/use-call-notifications';
import { ringtoneManager } from '@/lib/ringtone';
import { browserNotificationManager } from '@/lib/browser-notifications';

interface CallProviderProps {
  children: React.ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  console.log('🔔 CallProvider initialized');
  
  const { 
    incomingCall, 
    acceptCall, 
    declineCall, 
    dismissIncomingCall,
    isAccepting,
    isDeclining 
  } = useCall();
  
  const notificationRef = useRef<Notification | null>(null);
  
  console.log('🔔 CallProvider state:', { hasIncomingCall: !!incomingCall });
  
  // Initialize call notifications
  useCallNotifications();

  // Initialize ringtone manager
  useEffect(() => {
    ringtoneManager.initialize();
    return () => {
      ringtoneManager.cleanup();
    };
  }, []);

  // Handle incoming call notifications and sounds
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'ringing') {
      console.log('🔔 Starting ringtone and notification for incoming call');
      
      // Start ringtone
      ringtoneManager.startRingtone();
      
      // Show browser notification
      const showNotification = async () => {
        // TODO: Get caller info from consultation
        const notification = await browserNotificationManager.showIncomingCallNotification(
          'Caller', // Will be replaced with actual caller name
          'Patient' // Will be replaced with actual caller role
        );
        
        if (notification) {
          notificationRef.current = notification;
          
          // Handle notification clicks
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      };
      
      showNotification();
    } else {
      // Stop ringtone and close notification when call ends
      console.log('🔔 Stopping ringtone and closing notification');
      ringtoneManager.stopRingtone();
      
      if (notificationRef.current) {
        notificationRef.current.close();
        notificationRef.current = null;
      }
      
      browserNotificationManager.closeNotification('incoming-call');
    }
  }, [incomingCall]);

  // Request notification permission on mount
  useEffect(() => {
    browserNotificationManager.requestPermission();
  }, []);

  return (
    <>
      {children}
      
      {/* Global incoming call modal */}
      <IncomingCall
        callSession={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
        onDismiss={dismissIncomingCall}
        isAccepting={isAccepting}
        isDeclining={isDeclining}
      />
    </>
  );
}