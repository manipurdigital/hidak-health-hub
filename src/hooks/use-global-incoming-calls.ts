import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CallSession } from '@/hooks/use-call';

export function useGlobalIncomingCalls() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log('🌐 Setting up global incoming call listener for user:', user.id);

    // Enhanced check for existing incoming calls with better filtering
    const checkExistingCalls = async () => {
      try {
        const { data: existingCalls } = await supabase
          .from('call_sessions')
          .select(`
            *,
            call_participants!inner(user_id)
          `)
          .eq('status', 'ringing')
          .eq('call_participants.user_id', user.id)
          .neq('initiator_user_id', user.id)
          .gte('created_at', new Date(Date.now() - 30_000).toISOString()) // Only calls from last 30s
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingCalls && existingCalls.length > 0) {
          const call = existingCalls[0] as CallSession;
          console.log('🔔 Found existing incoming call:', call.id);
          setIncomingCall(call);
        } else {
          console.log('📞 No existing incoming calls found');
        }
      } catch (error) {
        console.error('❌ Error checking existing calls:', error);
      }
    };

    // Initial check
    checkExistingCalls();
    
    // Periodic check every 5 seconds as fallback
    checkTimeoutRef.current = setInterval(checkExistingCalls, 5000);

    // Listen for real-time incoming calls
    const channel = supabase
      .channel(`global-incoming-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_participants'
        },
        async (payload) => {
          console.log('👥 Global call participant INSERT:', payload);
          const participant = payload.new as any;
          
          // Check if this participant is for the current user
          if (participant.user_id === user.id) {
            // Get the call session details
            const { data: callSession } = await supabase
              .from('call_sessions')
              .select('*')
              .eq('id', participant.call_id)
              .single();

            if (callSession?.status === 'ringing' && callSession.initiator_user_id !== user.id) {
              console.log('🔔 Global incoming call detected:', callSession);
              setIncomingCall(callSession as CallSession);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions'
        },
        (payload) => {
          console.log('📞 Global call session UPDATE:', payload);
          const callSession = payload.new as any;
          
          // Clear incoming call if status changed from ringing
          if (callSession.status !== 'ringing') {
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up global incoming call listener');
      supabase.removeChannel(channel);
      if (checkTimeoutRef.current) {
        clearInterval(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
    };
  }, [user?.id]);

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  return {
    incomingCall,
    clearIncomingCall
  };
}