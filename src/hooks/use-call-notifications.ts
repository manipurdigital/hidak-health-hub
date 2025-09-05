import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id: string;
  data?: any;
}

export function useCallNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Deduplication for incoming call toasts
  const toastDedupeRef = useRef<Set<string>>(new Set());

  // Mutation to create notifications
  const createNotification = useMutation({
    mutationFn: async (notificationData: NotificationData) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          user_id: notificationData.user_id,
          data: notificationData.data || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate notifications query to update UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Listen for call-related events and create notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`call-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions'
        },
        async (payload) => {
          console.debug('Call session INSERT event:', payload);
          const callSession = payload.new as any;

          // Handle incoming call notifications - Show toast for callee
          if (callSession.status === 'ringing' && callSession.initiator_user_id !== user.id) {
            console.log('🔔 Processing incoming call for call_id:', callSession.id);
            
            // Check deduplication first
            const dedupeKey = `call-${callSession.id}`;
            if (toastDedupeRef.current.has(dedupeKey)) {
              console.log('🔔 Skipping duplicate toast for call:', callSession.id);
              return;
            }

            // Helper to show toast and mark as shown
            const showIncomingCallToast = (callerName: string) => {
              toastDedupeRef.current.add(dedupeKey);
              setTimeout(() => toastDedupeRef.current.delete(dedupeKey), 15000); // Clear after 15s
              
              toast({
                title: 'Incoming Call',
                description: `${callerName} is calling you`,
              });
              
              console.log('🔔 Showed incoming call toast for user:', user.id, 'from:', callerName);
            };

            // Get consultation without restrictive joins
            const { data: consultation } = await supabase
              .from('consultations')
              .select('*')
              .eq('id', callSession.consultation_id)
              .single();

            if (!consultation) {
              console.log('🔔 No consultation found for call:', callSession.consultation_id);
              return;
            }

            console.log('🔔 Consultation participants - patient:', consultation.patient_id, 'doctor:', consultation.doctor_id, 'current user:', user.id);

            // Check if current user is involved with retry for call_participants
            const checkParticipation = async (retryCount = 0): Promise<boolean> => {
              const { data: participant } = await supabase
                .from('call_participants')
                .select('*')
                .eq('call_id', callSession.id)
                .eq('user_id', user.id)
                .single();

              if (participant) {
                console.log('🔔 Found participant record for user:', user.id);
                return true;
              }

              // Retry up to 3 times with 300ms delays for race conditions
              if (retryCount < 3) {
                console.log('🔔 No participant record yet, retrying...', retryCount + 1);
                await new Promise(resolve => setTimeout(resolve, 300));
                return checkParticipation(retryCount + 1);
              }

              console.log('🔔 No participant record found after retries');
              return false;
            };

            const isParticipant = await checkParticipation();
            
            if (isParticipant) {
              // Get caller name from profiles
              const { data: callerProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', callSession.initiator_user_id)
                .single();

              // Get doctor name if needed
              let doctorName = '';
              if (consultation.doctor_id) {
                const { data: doctorData } = await supabase
                  .from('doctors')
                  .select('name, full_name')
                  .eq('id', consultation.doctor_id)
                  .single();
                doctorName = doctorData?.full_name || doctorData?.name || 'Doctor';
              }

              const callerName = callSession.initiator_user_id === consultation.patient_id
                ? callerProfile?.full_name || 'Patient'
                : doctorName || 'Doctor';

              showIncomingCallToast(callerName);
            } else {
              console.log('🔔 User is not a participant in this call');
            }
          } else {
            console.log('🔔 Skipping call notification - user is initiator or status not ringing:', {
              status: callSession.status,
              initiator: callSession.initiator_user_id,
              currentUser: user.id
            });
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
        async (payload) => {
          console.debug('Call session UPDATE event:', payload);
          const callSession = payload.new as any;
          const oldCallSession = payload.old as any;

          // Get consultation and participant details
          const { data: consultation } = await supabase
            .from('consultations')
            .select(`
              *,
              doctors!inner(name, full_name, user_id)
            `)
            .eq('id', callSession.consultation_id)
            .single();

          if (!consultation) return;

          // Get patient profile separately
          const { data: patientProfile } = await supabase
            .from('profiles')
            .select('full_name, user_id')
            .eq('user_id', consultation.patient_id)
            .single();

          const isUserPatient = consultation.patient_id === user.id;
          const isUserDoctor = consultation.doctors.user_id === user.id;
          const otherUserId = isUserPatient 
            ? consultation.doctors.user_id 
            : consultation.patient_id;

          // Call accepted (ringing -> active)
          if (oldCallSession.status === 'ringing' && callSession.status === 'active') {
            const callerName = callSession.initiator_user_id === consultation.patient_id
              ? patientProfile?.full_name || 'Patient'
              : consultation.doctors.full_name || consultation.doctors.name;

            const recipientName = callSession.initiator_user_id === consultation.patient_id
              ? consultation.doctors.full_name || consultation.doctors.name
              : patientProfile?.full_name || 'Patient';

            // Notify the initiator that call was accepted
            if (callSession.initiator_user_id !== user.id) {
              createNotification.mutate({
                title: 'Call Accepted',
                message: `${recipientName} accepted your call`,
                type: 'success',
                user_id: callSession.initiator_user_id,
                data: { 
                  event_type: 'call_accepted',
                  consultation_id: callSession.consultation_id,
                  call_id: callSession.id
                },
              });
            }

            // Show toast notification for current user
            if (isUserPatient || isUserDoctor) {
              toast({
                title: 'Call Connected',
                description: 'You are now connected to the video call',
              });
            }
          }

          // Call declined
          if (oldCallSession.status === 'ringing' && callSession.status === 'declined') {
            // Notify the initiator that call was declined
            if (callSession.initiator_user_id !== user.id) {
              const recipientName = callSession.initiator_user_id === consultation.patient_id
                ? consultation.doctors.full_name || consultation.doctors.name
                : patientProfile?.full_name || 'Patient';

              createNotification.mutate({
                title: 'Call Declined',
                message: `${recipientName} declined your call`,
                type: 'warning',
                user_id: callSession.initiator_user_id,
                data: { 
                  event_type: 'call_declined',
                  consultation_id: callSession.consultation_id,
                  call_id: callSession.id
                },
              });
            }
          }

          // Call ended
          if (callSession.status === 'ended' && oldCallSession.status !== 'ended') {
            // Notify both participants
            [consultation.patient_id, consultation.doctors.user_id].forEach(userId => {
              if (userId && userId !== user.id) {
                createNotification.mutate({
                  title: 'Call Ended',
                  message: 'The video call has ended',
                  type: 'info',
                  user_id: userId,
                  data: { 
                    event_type: 'call_ended',
                    consultation_id: callSession.consultation_id,
                    call_id: callSession.id
                  },
                });
              }
            });
          }

          // Call missed (timeout)
          if (callSession.status === 'missed') {
            // Notify both participants
            [consultation.patient_id, consultation.doctors.user_id].forEach(userId => {
              if (userId) {
                const isInitiator = userId === callSession.initiator_user_id;
                createNotification.mutate({
                  title: 'Missed Call',
                  message: isInitiator 
                    ? 'Your call was not answered'
                    : 'You missed a video call',
                  type: 'warning',
                  user_id: userId,
                  data: { 
                    event_type: 'call_missed',
                    consultation_id: callSession.consultation_id,
                    call_id: callSession.id
                  },
                });
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultations'
        },
        async (payload) => {
          const consultation = payload.new as any;
          const oldConsultation = payload.old as any;

          // Status changed notifications
          if (consultation.status !== oldConsultation.status) {
            const { data: consultationDetails } = await supabase
              .from('consultations')
              .select(`
                *,
                doctors!inner(name, full_name, user_id)
              `)
              .eq('id', consultation.id)
              .single();

            if (!consultationDetails) return;

            // Get patient profile separately
            const { data: consultationPatientProfile } = await supabase
              .from('profiles')
              .select('full_name, user_id')
              .eq('user_id', consultationDetails.patient_id)
              .single();


            let notificationTitle = '';
            let notificationMessage = '';
            const targetUsers: string[] = [];

            switch (consultation.status) {
              case 'confirmed':
                notificationTitle = 'Consultation Confirmed';
                notificationMessage = `Your consultation has been confirmed for ${new Date(consultation.consultation_date).toLocaleDateString()}`;
                targetUsers.push(consultation.patient_id);
                if (consultationDetails.doctors.user_id) {
                  targetUsers.push(consultationDetails.doctors.user_id);
                }
                break;

              case 'in_progress':
                notificationTitle = 'Consultation Started';
                notificationMessage = 'Your consultation is now in progress';
                targetUsers.push(consultation.patient_id);
                if (consultationDetails.doctors.user_id) {
                  targetUsers.push(consultationDetails.doctors.user_id);
                }
                break;

              case 'completed':
                notificationTitle = 'Consultation Completed';
                notificationMessage = 'Your consultation has been completed';
                targetUsers.push(consultation.patient_id);
                break;

              case 'cancelled':
                notificationTitle = 'Consultation Cancelled';
                notificationMessage = 'Your consultation has been cancelled';
                targetUsers.push(consultation.patient_id);
                if (consultationDetails.doctors.user_id) {
                  targetUsers.push(consultationDetails.doctors.user_id);
                }
                break;
            }

            // Send notifications to relevant users
            targetUsers.forEach(userId => {
              if (userId && notificationTitle) {
                createNotification.mutate({
                  title: notificationTitle,
                  message: notificationMessage,
                  type: consultation.status === 'cancelled' ? 'warning' : 'success',
                  user_id: userId,
                  data: { 
                    event_type: 'consultation_update',
                    consultation_id: consultation.id,
                    status: consultation.status
                  },
                });
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, createNotification, toast]);

  // Function to create appointment reminders
  const createAppointmentReminder = async (consultationId: string, reminderTime: number = 30) => {
    const { data: consultation } = await supabase
      .from('consultations')
      .select(`
        *,
        doctors!inner(name, full_name, user_id)
      `)
      .eq('id', consultationId)
      .single();

    if (!consultation) return;

    const appointmentTime = new Date(`${consultation.consultation_date}T${consultation.consultation_time}`);
    const reminderTime_ms = appointmentTime.getTime() - (reminderTime * 60 * 1000);
    const now = Date.now();

    // Only create reminder if appointment is in the future
    if (reminderTime_ms > now) {
      setTimeout(async () => {
        // Remind patient
        createNotification.mutate({
          title: 'Appointment Reminder',
          message: `Your consultation with Dr. ${consultation.doctors.name} is in ${reminderTime} minutes`,
          type: 'info',
          user_id: consultation.patient_id,
          data: { 
            event_type: 'appointment_reminder',
            consultation_id: consultationId,
            reminder_minutes: reminderTime
          },
        });

        // Get patient profile for doctor reminder
        const { data: reminderPatientProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', consultation.patient_id)
          .single();

        // Remind doctor
        if (consultation.doctors.user_id) {
          createNotification.mutate({
            title: 'Appointment Reminder',
            message: `Your consultation with ${reminderPatientProfile?.full_name || 'Patient'} is in ${reminderTime} minutes`,
            type: 'info',
            user_id: consultation.doctors.user_id,
            data: { 
              event_type: 'appointment_reminder',
              consultation_id: consultationId,
              reminder_minutes: reminderTime
            },
          });
        }
      }, reminderTime_ms - now);
    }
  };

  return {
    createNotification: createNotification.mutate,
    createAppointmentReminder,
    isCreatingNotification: createNotification.isPending,
  };
}