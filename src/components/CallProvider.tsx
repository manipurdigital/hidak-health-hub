import React, { useEffect, useRef, memo } from 'react';
import { IncomingCall } from '@/components/IncomingCall';
import { useCall } from '@/hooks/use-call';
import { useCallNotifications } from '@/hooks/use-call-notifications';
import { useGlobalIncomingCalls } from '@/hooks/use-global-incoming-calls';
import { ringtoneManager } from '@/lib/ringtone';
import { browserNotificationManager } from '@/lib/browser-notifications';

interface CallProviderProps {
  children: React.ReactNode;
}

const CallProviderComponent = ({ children }: CallProviderProps) => {
  // Use global incoming call detection instead of consultation-specific
  const { incomingCall, clearIncomingCall } = useGlobalIncomingCalls();
  
  // Get call actions from a general useCall hook
  const { 
    acceptCall, 
    declineCall,
    isAccepting,
    isDeclining 
  } = useCall();
  
  const notificationRef = useRef<Notification | null>(null);
  const ringtoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('🔔 CallProvider state:', { 
    hasIncomingCall: !!incomingCall,
    callId: incomingCall?.id,
    callStatus: incomingCall?.status 
  });
  
  // Initialize call notifications
  useCallNotifications();

  // Initialize ringtone manager
  useEffect(() => {
    ringtoneManager.initialize();
    return () => {
      ringtoneManager.cleanup();
    };
  }, []);

  // Handle incoming call notifications and sounds with better cleanup
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'ringing') {
      console.log('🔔 Starting ringtone and notification for incoming call:', incomingCall.id);
      
      // Clear any existing timeout
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
      }
      
      // Start ringtone
      ringtoneManager.startRingtone();
      
      // Auto-stop ringtone after 30 seconds
      ringtoneTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stopping ringtone after 30 seconds');
        ringtoneManager.stopRingtone();
      }, 30_000);
      
      // Show browser notification
      const showNotification = async () => {
        try {
          const notification = await browserNotificationManager.showIncomingCallNotification(
            'Incoming Call', // Will be replaced with actual caller name
            'Consultation Call' // Will be replaced with actual caller role
          );
          
          if (notification) {
            notificationRef.current = notification;
            
            // Handle notification clicks
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        } catch (error) {
          console.error('❌ Failed to show notification:', error);
        }
      };
      
      showNotification();
    } else {
      // Stop ringtone and close notification when call ends
      console.log('🔔 Stopping ringtone and closing notification');
      
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
        ringtoneTimeoutRef.current = null;
      }
      
      ringtoneManager.stopRingtone();
      
      if (notificationRef.current) {
        notificationRef.current.close();
        notificationRef.current = null;
      }
      
      browserNotificationManager.closeNotification('incoming-call');
    }
    
    return () => {
      if (ringtoneTimeoutRef.current) {
        clearTimeout(ringtoneTimeoutRef.current);
        ringtoneTimeoutRef.current = null;
      }
    };
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
        onAccept={(callId) => {
          acceptCall(callId);
          clearIncomingCall();
        }}
        onDecline={(callId) => {
          declineCall(callId);
          clearIncomingCall();
        }}
        onDismiss={clearIncomingCall}
        isAccepting={isAccepting}
        isDeclining={isDeclining}
      />
    </>
  );
};

// Memoize to prevent unnecessary re-renders
export const CallProvider = memo(CallProviderComponent);