import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { callStateManager } from '@/lib/call-state-manager';

export interface CallSession {
  id: string;
  consultation_id: string;
  channel_name: string;
  call_type: 'video' | 'audio';
  status: 'ringing' | 'active' | 'declined' | 'missed' | 'ended' | 'failed';
  initiator_user_id: string;
  accepted_at?: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  role: 'doctor' | 'patient';
  rtc_uid?: string;
  joined_at?: string;
  left_at?: string;
  is_audio_muted: boolean;
  is_video_muted: boolean;
  created_at: string;
}

export function useCall(consultationId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  
  // Stable refs to prevent re-renders
  const consultationIdRef = useRef(consultationId);
  const userIdRef = useRef(user?.id);
  const lastInitiateRef = useRef<number>(0);
  const initiateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when values change
  useEffect(() => {
    consultationIdRef.current = consultationId;
    userIdRef.current = user?.id;
  }, [consultationId, user?.id]);

  // Get active call session for consultation
  const { data: activeCall, isLoading } = useQuery({
    queryKey: ['active-call', consultationId],
    queryFn: async () => {
      if (!consultationId) return null;
      
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('consultation_id', consultationId)
        .in('status', ['ringing', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Auto-expire stale ringing calls (> 60s)
      if (data && data.status === 'ringing') {
        const createdAt = new Date(data.created_at).getTime();
        if (Date.now() - createdAt > 60_000) {
          await supabase
            .from('call_sessions')
            .update({ status: 'missed' })
            .eq('id', data.id);
          return null;
        }
      }

      return data as CallSession | null;
    },
    enabled: !!consultationId,
    refetchInterval: 2000, // Check for active calls every 2 seconds
  });

  // Get call participants
  const { data: participants } = useQuery({
    queryKey: ['call-participants', currentCallId],
    queryFn: async () => {
      if (!currentCallId) return [];
      
      const { data, error } = await supabase
        .from('call_participants')
        .select('*')
        .eq('call_id', currentCallId);

      if (error) throw error;
      return data as CallParticipant[];
    },
    enabled: !!currentCallId,
  });

  // Auto-expire old ringing calls periodically
  useEffect(() => {
    if (!user?.id) return;

    const cleanup = setInterval(async () => {
      try {
        const { data: expiredCalls } = await supabase
          .from('call_sessions')
          .select('id')
          .eq('status', 'ringing')
          .lt('created_at', new Date(Date.now() - 30_000).toISOString());

        if (expiredCalls && expiredCalls.length > 0) {
          console.log('🕐 Auto-expiring old ringing calls:', expiredCalls.map(c => c.id));
          await supabase
            .from('call_sessions')
            .update({ status: 'missed' })
            .in('id', expiredCalls.map(c => c.id));
        }
      } catch (error) {
        console.error('❌ Failed to cleanup expired calls:', error);
      }
    }, 15_000); // Check every 15 seconds

    return () => clearInterval(cleanup);
  }, [user?.id]);

  // Listen for real-time call updates with better debouncing
  useEffect(() => {
    if (!user?.id || !consultationId) return;

    console.log('🔄 Setting up realtime subscription for consultation:', consultationId);

    const channel = supabase
      .channel(`consultation-calls-${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `consultation_id=eq.${consultationId}`
        },
        (payload) => {
          console.log('📞 Call session realtime event:', payload);
          
          // Debounce rapid updates
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['active-call', consultationId] });
            queryClient.invalidateQueries({ queryKey: ['call-participants'] });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up realtime subscription for consultation:', consultationId);
      supabase.removeChannel(channel);
    };
  }, [user?.id, consultationId, queryClient]);

  // Update current call ID when active call changes
  useEffect(() => {
    setCurrentCallId(activeCall?.id || null);
  }, [activeCall]);

  // Mutation to initiate a call with debouncing
  const initiateCall = useMutation({
    mutationFn: async ({ consultationId, callType = 'video' }: { 
      consultationId: string; 
      callType?: 'video' | 'audio' 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Implement debouncing to prevent rapid successive calls
      const now = Date.now();
      if (now - lastInitiateRef.current < 2000) {
        throw new Error('Please wait before initiating another call');
      }
      lastInitiateRef.current = now;

      console.log('🔥 INITIATING CALL for consultation:', consultationId, 'type:', callType, 'user:', user.id);

      // Check for existing active or ringing calls more comprehensively
      const { data: existingCalls } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('consultation_id', consultationId)
        .in('status', ['ringing', 'active'])
        .order('created_at', { ascending: false });

      // If there's any existing active/ringing call, return it
      if (existingCalls && existingCalls.length > 0) {
        const existingCall = existingCalls[0];
        console.log('🔄 Found existing call, not creating duplicate:', existingCall.id, 'status:', existingCall.status);
        
        // If it's an old ringing call (>30s), mark as missed and create new one
        if (existingCall.status === 'ringing') {
          const callAge = Date.now() - new Date(existingCall.created_at).getTime();
          if (callAge > 30_000) {
            console.log('🕐 Existing call is too old, marking as missed and creating new one');
            await supabase
              .from('call_sessions')
              .update({ status: 'missed' })
              .eq('id', existingCall.id);
          } else {
            return existingCall as CallSession;
          }
        } else {
          return existingCall as CallSession;
        }
      }

      const channelName = `consultation_${consultationId}_${Date.now()}`;
      
      // Create call session
      const { data: callSession, error: callError } = await supabase
        .from('call_sessions')
        .insert({
          consultation_id: consultationId,
          channel_name: channelName,
          call_type: callType,
          status: 'ringing',
          initiator_user_id: user.id,
        })
        .select()
        .single();

      if (callError) throw callError;
      console.debug('Call session created:', callSession.id);

      // Get consultation details to determine participants
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .select('id, patient_id, doctor_id')
        .eq('id', consultationId)
        .single();

      if (consultationError) throw consultationError;

      // Determine the other participant without relying on FK joins
      let otherUserId: string;
      if (consultation.patient_id === user.id) {
        const { data: doctorRow, error: doctorError } = await supabase
          .from('doctors')
          .select('user_id')
          .eq('id', consultation.doctor_id)
          .single();
        if (doctorError) throw doctorError;
        otherUserId = doctorRow.user_id;
      } else {
        otherUserId = consultation.patient_id;
      }

      // Create participant records
      const participants = [
        {
          call_id: callSession.id,
          user_id: user.id,
          role: consultation.patient_id === user.id ? 'patient' : 'doctor',
          rtc_uid: `${user.id}_${Date.now()}`,
        },
        {
          call_id: callSession.id,
          user_id: otherUserId,
          role: consultation.patient_id === user.id ? 'doctor' : 'patient',
          rtc_uid: `${otherUserId}_${Date.now()}`,
        }
      ];

      const { error: participantsError } = await supabase
        .from('call_participants')
        .insert(participants);

      if (participantsError) throw participantsError;
      console.debug('Call participants created');

      // Create notification for the callee with proper type
      console.debug('🔔 Creating incoming call notification for user:', otherUserId);
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          title: 'Incoming Call',
          message: `You have an incoming ${callType} call for your consultation`,
          type: 'info', // Use proper severity type
          data: {
            event_type: 'incoming_call', // Store actual event type here
            callSessionId: callSession.id,
            consultationId: consultationId,
            callType: callType,
            channelName: channelName
          }
        });

      if (notificationError) {
        console.error('❌ Failed to create incoming call notification:', notificationError);
        // Don't throw here, call should still work
      } else {
        console.debug('✅ Successfully created incoming call notification');
      }

      return callSession;
    },
    onSuccess: (callSession) => {
      setCurrentCallId(callSession.id);
      console.debug('Call initiated successfully:', callSession.id);
      toast({
        title: "Call Initiated",
        description: "Waiting for the other participant to answer...",
      });
    },
    onError: (error: any) => {
      console.error('Failed to initiate call:', error);
      toast({
        title: "Call Failed",
        description: error.message || 'Failed to initiate call',
        variant: "destructive",
      });
    }
  });

  // Mutation to accept a call
  const acceptCall = useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase
        .from('call_sessions')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (callSession) => {
      setCurrentCallId(callSession.id);
      setIncomingCall(null);
      toast({
        title: "Call Accepted",
        description: "Connecting to video call...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept Call",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to decline a call
  const declineCall = useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase
        .from('call_sessions')
        .update({ status: 'declined' })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIncomingCall(null);
      toast({
        title: "Call Declined",
        description: "You declined the incoming call.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to end a call
  const endCall = useMutation({
    mutationFn: async (callId: string) => {
      const { data, error } = await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;

      // Update participant left_at timestamp
      if (user?.id) {
        await supabase
          .from('call_participants')
          .update({ left_at: new Date().toISOString() })
          .eq('call_id', callId)
          .eq('user_id', user.id);
      }

      return data;
    },
    onSuccess: () => {
      setCurrentCallId(null);
      toast({
        title: "Call Ended",
        description: "The call has been ended.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Ending Call",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update participant state (mute/unmute)
  const updateParticipantState = useMutation({
    mutationFn: async ({ 
      callId, 
      isAudioMuted, 
      isVideoMuted 
    }: { 
      callId: string; 
      isAudioMuted?: boolean; 
      isVideoMuted?: boolean; 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: any = {};
      if (isAudioMuted !== undefined) updateData.is_audio_muted = isAudioMuted;
      if (isVideoMuted !== undefined) updateData.is_video_muted = isVideoMuted;

      const { data, error } = await supabase
        .from('call_participants')
        .update(updateData)
        .eq('call_id', callId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  const dismissIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return {
    // State
    activeCall,
    currentCallId,
    incomingCall,
    participants,
    isLoading,
    
    // Actions
    initiateCall: initiateCall.mutate,
    acceptCall: acceptCall.mutate,
    declineCall: declineCall.mutate,
    endCall: endCall.mutate,
    updateParticipantState: updateParticipantState.mutate,
    dismissIncomingCall,
    
    // Loading states
    isInitiating: initiateCall.isPending,
    isAccepting: acceptCall.isPending,
    isDeclining: declineCall.isPending,
    isEnding: endCall.isPending,
  };
}