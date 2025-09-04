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

  // Play ringtone sound (optional)
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;

    if (callSession && callSession.status === 'ringing') {
      // Create a simple ringtone
      try {
        audioContext = new AudioContext();
        const playRingtone = () => {
          if (!audioContext) return;
          
          oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.5);
        };

        // Play ringtone every 2 seconds
        const ringtoneInterval = setInterval(playRingtone, 2000);
        playRingtone(); // Play immediately

        return () => {
          clearInterval(ringtoneInterval);
          if (oscillator) {
            try {
              oscillator.stop();
            } catch (e) {
              // Oscillator might already be stopped
            }
          }
          if (audioContext) {
            audioContext.close();
          }
        };
      } catch (error) {
        console.warn('Could not create audio context for ringtone:', error);
      }
    }
  }, [callSession?.status]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Incoming {callSession.call_type === 'video' ? 'Video' : 'Audio'} Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {/* Caller Avatar */}
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl bg-primary/10">
                {callerDetails?.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Info */}
          <div>
            <h3 className="text-xl font-semibold">
              {callerDetails?.name || 'Unknown Caller'}
            </h3>
            <p className="text-muted-foreground">
              {callerDetails?.role}
            </p>
            {callSession.call_type === 'video' && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Video className="w-4 h-4" />
                Video Call
              </p>
            )}
            {callSession.call_type === 'audio' && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Mic className="w-4 h-4" />
                Audio Call
              </p>
            )}
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Auto-decline in {timeLeft}s
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-8">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full w-16 h-16"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            <Button
              size="lg"
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>

          {(isAccepting || isDeclining) && (
            <p className="text-sm text-muted-foreground">
              {isAccepting ? 'Accepting call...' : 'Declining call...'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}