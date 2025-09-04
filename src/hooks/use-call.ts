import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

  console.log('🔥 useCall hook initialized:', { consultationId, userId: user?.id });

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

  // Listen for real-time call updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`user-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions'
        },
        (payload) => {
          console.log('📞 Call session realtime event:', payload);
          
          const callSession = payload.new as CallSession;
          
          // Clear incoming call if status changed from ringing
          if (payload.eventType === 'UPDATE' && callSession.status !== 'ringing') {
            setIncomingCall(null);
          }
          
          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['active-call'] });
          queryClient.invalidateQueries({ queryKey: ['call-participants'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_participants'
        },
        async (payload) => {
          console.log('👥 Call participant INSERT event:', payload);
          const participant = payload.new as CallParticipant;
          
          // Check if this is for the current user and the call is ringing
          if (participant.user_id === user.id) {
            const { data: callSession } = await supabase
              .from('call_sessions')
              .select('*')
              .eq('id', participant.call_id)
              .single();

            if (callSession?.status === 'ringing' && callSession.initiator_user_id !== user.id) {
              console.log('🔔 Setting incoming call for user:', user.id);
              setIncomingCall(callSession as CallSession);
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['call-participants'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_participants'
        },
        (payload) => {
          console.log('👥 Call participant UPDATE event:', payload);
          queryClient.invalidateQueries({ queryKey: ['call-participants'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up realtime subscription for user:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Update current call ID when active call changes
  useEffect(() => {
    setCurrentCallId(activeCall?.id || null);
  }, [activeCall]);

  // Mutation to initiate a call
  const initiateCall = useMutation({
    mutationFn: async ({ consultationId, callType = 'video' }: { 
      consultationId: string; 
      callType?: 'video' | 'audio' 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      console.log('🔥 INITIATING CALL for consultation:', consultationId, 'type:', callType, 'user:', user.id);

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

      // Create notification for the callee
      console.debug('Creating incoming call notification for user:', otherUserId);
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          title: 'Incoming Call',
          message: `You have an incoming ${callType} call for your consultation`,
          type: 'incoming_call',
          data: {
            callSessionId: callSession.id,
            consultationId: consultationId,
            callType: callType,
            channelName: channelName
          }
        });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw here, call should still work
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