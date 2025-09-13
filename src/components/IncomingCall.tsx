import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CallSession } from '@/hooks/use-call';

interface IncomingCallProps {
  callSession: CallSession | null;
  onAccept: (callId: string) => void;
  onDecline: (callId: string) => void;
  onDismiss: () => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function IncomingCall({
  callSession,
  onAccept,
  onDecline,
  onDismiss,
  isAccepting = false,
  isDeclining = false,
}: IncomingCallProps) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout

  // Get caller details
  const { data: callerDetails } = useQuery({
    queryKey: ['caller-details', callSession?.consultation_id],
    queryFn: async () => {
      if (!callSession) return null;

      const { data: consultation, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctors!inner(name, full_name, profile_image_url, user_id)
        `)
        .eq('id', callSession.consultation_id)
        .single();

      if (error) throw error;

      // Get patient profile separately
      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('full_name, user_id')
        .eq('user_id', consultation.patient_id)
        .single();

      // Determine if caller is doctor or patient
      const isCallerDoctor = consultation.doctors.user_id === callSession.initiator_user_id;
      
      if (isCallerDoctor) {
        return {
          name: consultation.doctors.full_name || consultation.doctors.name,
          role: 'Doctor',
          avatar: consultation.doctors.profile_image_url,
        };
      } else {
        return {
          name: patientProfile?.full_name || 'Patient',
          role: 'Patient',
          avatar: null,
        };
      }
    },
    enabled: !!callSession,
  });

  // Countdown timer
  useEffect(() => {
    if (!callSession) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-decline when time runs out
          onDecline(callSession.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [callSession, onDecline]);

  // Reset timer when new call comes in
  useEffect(() => {
    if (callSession) {
      setTimeLeft(30);
    }
  }, [callSession?.id]);

  // Note: Ringtone is now handled globally in CallProvider

  if (!callSession || callSession.status !== 'ringing') {
    return null;
  }

  const handleAccept = () => {
    onAccept(callSession.id);
  };

  const handleDecline = () => {
    onDecline(callSession.id);
  };

  return (
    <Dialog open={true} onOpenChange={() => onDismiss()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Incoming {callSession.call_type === 'video' ? 'Video' : 'Audio'} Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-8 py-4">
          {/* Caller Avatar with pulsing animation */}
          <div className="flex justify-center relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-32 h-32 rounded-full bg-primary/20"></div>
            </div>
            <div className="absolute inset-2 animate-pulse">
              <div className="w-28 h-28 rounded-full bg-primary/30"></div>
            </div>
            <Avatar className="w-24 h-24 relative z-10 border-4 border-primary/30 shadow-lg">
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-bold">
                {callerDetails?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              {callerDetails?.name || 'Unknown Caller'}
            </h3>
            <p className="text-lg text-muted-foreground font-medium">
              {callerDetails?.role}
            </p>
            {callSession.call_type === 'video' && (
              <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-primary/10 rounded-full inline-flex">
                <Video className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Video Call</span>
              </div>
            )}
            {callSession.call_type === 'audio' && (
              <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 bg-primary/10 rounded-full inline-flex">
                <Mic className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Audio Call</span>
              </div>
            )}
          </div>

          {/* Pulsing "Incoming..." text */}
          <div className="animate-pulse">
            <p className="text-lg text-primary font-semibold">Incoming Call...</p>
          </div>

          {/* Timer with enhanced styling */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              Auto-decline in {timeLeft}s
            </p>
            <div className="w-full bg-muted/50 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-1000 ease-linear shadow-sm"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons with enhanced animations */}
          <div className="flex items-center justify-center gap-12 pt-4">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-20 h-20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 bg-red-500 hover:bg-red-600 border-4 border-red-200"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            
            <Button
              size="lg"
              className="rounded-full w-20 h-20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 bg-green-500 hover:bg-green-600 border-4 border-green-200 animate-pulse"
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>

          {(isAccepting || isDeclining) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground font-medium">
                {isAccepting ? 'Accepting call...' : 'Declining call...'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}