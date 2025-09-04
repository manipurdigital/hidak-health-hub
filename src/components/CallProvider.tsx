import React from 'react';
import { IncomingCall } from '@/components/IncomingCall';
import { useCall } from '@/hooks/use-call';
import { useCallNotifications } from '@/hooks/use-call-notifications';

interface CallProviderProps {
  children: React.ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const { 
    incomingCall, 
    acceptCall, 
    declineCall, 
    dismissIncomingCall,
    isAccepting,
    isDeclining 
  } = useCall();
  
  // Initialize call notifications
  useCallNotifications();

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