
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Timer, 
  MessageSquare, 
  AlertCircle, 
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInHours, isPast } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface ConsultationMessage {
  id: string;
  content: string;
  sender_type: 'patient' | 'doctor';
  sent_at: string;
  sender_id: string;
}

interface ConsultationChatWindowProps {
  consultationId: string;
  isPatient?: boolean;
}

export default function ConsultationChatWindow({ consultationId, isPatient = false }: ConsultationChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  // Get consultation details
  const { data: consultation } = useQuery({
    queryKey: ['consultation-chat-details', consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          profiles!consultations_patient_id_fkey(full_name, phone, email)
        `)
        .eq('id', consultationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!consultationId,
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['consultation-messages', consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      return data as ConsultationMessage[];
    },
    enabled: !!consultationId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Count patient messages in follow-up window
  const { data: patientMessageCount = 0 } = useQuery({
    queryKey: ['patient-message-count', consultationId, consultation?.completed_at],
    queryFn: async () => {
      if (!consultation?.completed_at) return 0;

      const { count, error } = await supabase
        .from('consultation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('consultation_id', consultationId)
        .eq('sender_type', 'patient')
        .gte('sent_at', consultation.completed_at);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!consultation?.completed_at,
    refetchInterval: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('consultation_messages')
        .insert({
          consultation_id: consultationId,
          content,
          sender_id: user?.id,
          sender_type: isPatient ? 'patient' : 'doctor'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['consultation-messages', consultationId] });
      queryClient.invalidateQueries({ queryKey: ['patient-message-count', consultationId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const getFollowUpInfo = () => {
    if (!consultation?.completed_at || !consultation?.follow_up_expires_at) return null;

    const expiresAt = new Date(consultation.follow_up_expires_at);
    const now = new Date();
    const hoursLeft = differenceInHours(expiresAt, now);
    const isExpired = isPast(expiresAt);

    return {
      expiresAt,
      hoursLeft: Math.max(0, hoursLeft),
      isExpired,
      patientMessagesLeft: Math.max(0, 10 - patientMessageCount)
    };
  };

  const followUpInfo = getFollowUpInfo();
  const canSendMessage = () => {
    if (!consultation) return false;
    
    // During active consultation
    if (consultation.status === 'scheduled' || consultation.status === 'in_progress') {
      return true;
    }
    
    // After completion - check follow-up window
    if (consultation.status === 'completed' && followUpInfo) {
      if (followUpInfo.isExpired) return false;
      if (isPatient && followUpInfo.patientMessagesLeft <= 0) return false;
      return true;
    }
    
    return false;
  };

  const getStatusMessage = () => {
    if (!consultation) return null;

    if (consultation.status === 'scheduled') {
      return (
        <div className="text-center py-4 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2" />
          <p>Consultation scheduled for {format(new Date(consultation.consultation_date), 'MMM dd, yyyy')} at {consultation.time_slot}</p>
        </div>
      );
    }

    if (consultation.status === 'completed' && followUpInfo) {
      if (followUpInfo.isExpired) {
        return (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <h3 className="font-medium text-red-900">Follow-up Window Closed</h3>
              <p className="text-sm text-red-700 mb-4">
                The 72-hour follow-up period ended on {format(followUpInfo.expiresAt, 'MMM dd, yyyy HH:mm')}
              </p>
              {isPatient && (
                <Button 
                  onClick={() => window.location.href = '/doctors'} 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Follow-up Consultation
                </Button>
              )}
            </CardContent>
          </Card>
        );
      } else {
        return (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">Follow-up Window Active</h3>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <span>
                      {followUpInfo.hoursLeft > 0 ? `${followUpInfo.hoursLeft} hours remaining` : 'Less than 1 hour remaining'}
                    </span>
                    {isPatient && (
                      <span>• {followUpInfo.patientMessagesLeft} messages left</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {getStatusMessage()}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Consultation Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_type === (isPatient ? 'patient' : 'doctor') ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[70%] ${
                      message.sender_type === (isPatient ? 'patient' : 'doctor') ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender_type === 'patient' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Stethoscope className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_type === (isPatient ? 'patient' : 'doctor')
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(message.sent_at), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          {canSendMessage() ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="icon"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {consultation?.status === 'completed' && followUpInfo?.isExpired ? (
                <p>Chat is now read-only. The follow-up period has ended.</p>
              ) : consultation?.status === 'completed' && isPatient && followUpInfo?.patientMessagesLeft === 0 ? (
                <p>You have reached the 10 message limit for this follow-up period.</p>
              ) : (
                <p>Chat will be available once the consultation begins.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
