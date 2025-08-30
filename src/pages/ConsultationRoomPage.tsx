import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConsultation, useConsultationMessages, useSendMessage } from '@/hooks/doctor-hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';
import { VideoConsultation } from '@/components/VideoConsultation';

export function ConsultationRoomPage() {
  const { consultId } = useParams<{ consultId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallError, setVideoCallError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: consultation, isLoading: consultationLoading, error: consultationError } = useConsultation(consultId!);
  const { data: messages = [], refetch: refetchMessages } = useConsultationMessages(consultId!);
  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5 seconds (in real app, use real-time subscriptions)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchMessages]);

  if (consultationLoading) {
    return <ConsultationRoomSkeleton />;
  }

  if (consultationError || !consultation) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Consultation Not Found"
          description="The consultation room you're looking for doesn't exist or you don't have access to it."
          action={{
            label: "Back to Dashboard",
            onClick: () => navigate('/dashboard')
          }}
        />
      </div>
    );
  }

  // Check if user has access to this consultation
  const isDoctor = user?.id === consultation.doctor?.user_id;
  const isPatient = user?.id === consultation.patient_id;
  
  if (!isDoctor && !isPatient) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Access Denied"
          description="You don't have permission to access this consultation room."
          action={{
            label: "Back to Dashboard",
            onClick: () => navigate('/dashboard')
          }}
        />
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        consultationId: consultId!,
        content: message.trim(),
        senderType: isDoctor ? 'doctor' : 'patient',
      });
      setMessage('');
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartVideoCall = () => {
    setIsVideoCallActive(true);
    setVideoCallError(null);
  };

  const handleEndVideoCall = () => {
    setIsVideoCallActive(false);
    setVideoCallError(null);
  };

  const handleVideoCallError = (error: string) => {
    setVideoCallError(error);
    setIsVideoCallActive(false);
  };

  const getConsultationStatusBadge = () => {
    switch (consultation.status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in-progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{consultation.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            {getConsultationStatusBadge()}
          </div>

          {/* Doctor/Patient Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage 
                      src={consultation.doctor?.profile_image_url} 
                      alt={consultation.doctor?.full_name} 
                    />
                    <AvatarFallback>
                      {consultation.doctor?.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">
                      Consultation with {consultation.doctor?.full_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {consultation.doctor?.specialization} • {consultation.consultation_type} consultation
                    </p>
                  </div>
                </div>

                {/* Video Call Controls */}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleStartVideoCall} 
                    size="sm"
                    disabled={isVideoCallActive}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isVideoCallActive ? "Call Active" : "Start Video Call"}
                  </Button>
                  {videoCallError && (
                    <div className="text-sm text-red-600">
                      Connection failed
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Video Call Component */}
          <VideoConsultation
            consultationId={consultId!}
            isActive={isVideoCallActive}
            onEnd={handleEndVideoCall}
            onError={handleVideoCallError}
          />

          {/* Chat Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Messages</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg: any) => {
                    const isCurrentUser = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.sent_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConsultationRoomSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}