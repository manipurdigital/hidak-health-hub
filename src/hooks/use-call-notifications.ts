import { useEffect } from 'react';
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

          // Handle incoming call notifications - ONLY show toast, don't create DB notification
          // The DB notification is created by the initiator in use-call.ts
          if (callSession.status === 'ringing' && callSession.initiator_user_id !== user.id) {
            console.debug('🔔 Processing incoming call toast notification');
            // Get consultation details to find the callee
            const { data: consultation } = await supabase
              .from('consultations')
              .select(`
                *,
                doctors!inner(name, full_name, user_id)
              `)
              .eq('id', callSession.consultation_id)
              .single();

            if (!consultation) {
              console.debug('No consultation found for call:', callSession.consultation_id);
              return;
            }

            // Determine if current user is the callee
            const isUserPatient = consultation.patient_id === user.id;
            const isUserDoctor = consultation.doctors.user_id === user.id;
            
            if (isUserPatient || isUserDoctor) {
              // Get caller profile
              const { data: callerProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', callSession.initiator_user_id)
                .single();

              const callerName = callSession.initiator_user_id === consultation.patient_id
                ? callerProfile?.full_name || 'Patient'
                : consultation.doctors.full_name || consultation.doctors.name || 'Doctor';

              // Show toast notification instead of DB notification to prevent duplicates
              toast({
                title: 'Incoming Call',
                description: `${callerName} is calling you`,
              });

              console.debug('🔔 Showed incoming call toast for user:', user.id);
            } else {
              console.debug('User is not involved in this call - patient:', consultation.patient_id, 'doctor:', consultation.doctors.user_id, 'current user:', user.id);
            }
          } else {
            console.debug('Skipping incoming call notification - user is initiator or status is not ringing:', {
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