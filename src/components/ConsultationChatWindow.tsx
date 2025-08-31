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
  message: string;
  message_type: string;
  sender_id: string;
  consultation_id: string;
  created_at: string;
  file_url?: string;
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
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ConsultationMessage[];
    },
    enabled: !!consultationId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const isCompleted = consultation?.status === 'completed';
  const completedAt = consultation?.status === 'completed' ? consultation?.created_at : null;

  // Count patient messages in follow-up window
  const { data: patientMessageCount = 0 } = useQuery({
    queryKey: ['patient-message-count', consultationId, completedAt],
    queryFn: async () => {
      if (!completedAt) return 0;

      const hoursPassedSinceCompletion = differenceInHours(new Date(), new Date(completedAt));
      
      if (hoursPassedSinceCompletion > 72) return 0;

      const { count, error } = await supabase
        .from('consultation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('consultation_id', consultationId)
        .eq('sender_id', user?.id)
        .gte('created_at', completedAt);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!completedAt,
    refetchInterval: 30000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const { error } = await supabase
        .from('consultation_messages')
        .insert({
          message: messageText,
          sender_id: user?.id,
          consultation_id: consultationId,
          message_type: 'text'
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

  const canUseFollowUp = isCompleted;
  const followUpExpiresAt = null; // Remove follow-up expiry for now

  const canSendMessage = () => {
    if (!consultation) return false;
    
    // During active consultation
    if (consultation.status === 'scheduled' || consultation.status === 'in_progress') {
      return true;
    }
    
    // After completion - simplified follow-up
    if (consultation.status === 'completed' && canUseFollowUp) {
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
          <p>Consultation scheduled for {format(new Date(consultation.consultation_date), 'PPP')} at {consultation.consultation_time}</p>
        </div>
      );
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
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[70%] ${
                      message.sender_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {message.sender_id === user?.id ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Stethoscope className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(message.created_at), 'p')}</span>
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
              <p>Chat will be available once the consultation begins.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}