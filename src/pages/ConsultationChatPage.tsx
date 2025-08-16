import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, Send, Calendar, Clock, User, Stethoscope, 
  FileText, Pill, CheckCircle, MessageCircle 
} from 'lucide-react';

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  time_slot: string;
  status: string;
  consultation_type: string;
  total_amount: number;
  patient_notes?: string;
  doctor_notes?: string;
  doctor: {
    full_name: string;
    specialization: string;
    profile_image_url?: string;
  };
}

interface Message {
  id: string;
  consultation_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  sent_at: string;
  is_read: boolean;
}

interface Prescription {
  id: string;
  prescription_number: string;
  medications: any;
  diagnosis?: string;
  instructions?: string;
  created_at: string;
}

const ConsultationChatPage = () => {
  const { consultationId } = useParams<{ consultationId: string }>();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (consultationId) {
      fetchConsultationData();
      setupRealtimeSubscription();
    }
  }, [consultationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConsultationData = async () => {
    try {
      // Fetch consultation details
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:doctors(full_name, specialization, profile_image_url)
        `)
        .eq('id', consultationId)
        .single();

      if (consultationError) throw consultationError;
      setConsultation(consultationData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('consultation_messages')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('sent_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Fetch prescription if exists
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('consultation_id', consultationId)
        .single();

      if (!prescriptionError && prescriptionData) {
        setPrescription(prescriptionData);
      }

    } catch (error) {
      console.error('Error fetching consultation data:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`consultation_${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
          filter: `consultation_id=eq.${consultationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prescriptions',
          filter: `consultation_id=eq.${consultationId}`
        },
        (payload) => {
          setPrescription(payload.new as Prescription);
          toast({
            title: "Prescription Added",
            description: "Doctor has added a prescription for you"
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !consultation) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('consultation_messages')
        .insert([{
          consultation_id: consultationId,
          sender_id: user.id,
          sender_type: user.id === consultation.patient_id ? 'patient' : 'doctor',
          content: newMessage.trim()
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Consultation not found</h2>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPatient = user?.id === consultation.patient_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              {consultation.doctor.profile_image_url ? (
                <img 
                  src={consultation.doctor.profile_image_url} 
                  alt={consultation.doctor.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Stethoscope className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="font-semibold">{consultation.doctor.full_name}</h1>
              <p className="text-sm text-primary-foreground/80">{consultation.doctor.specialization}</p>
            </div>
          </div>
          <Badge 
            variant={consultation.status === 'completed' ? 'default' : 'secondary'}
            className="bg-primary-foreground/20 text-primary-foreground"
          >
            {consultation.status}
          </Badge>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Consultation Chat
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(consultation.consultation_date), 'PPP')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {consultation.time_slot}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(message.sent_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[40px] max-h-[120px]"
                    rows={1}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Consultation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consultation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{format(new Date(consultation.consultation_date), 'PPPP')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{consultation.time_slot}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary" />
                  <span>₹{consultation.total_amount}</span>
                </div>
                {consultation.patient_notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">Patient Notes:</p>
                    <p className="text-sm text-muted-foreground">{consultation.patient_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescription */}
            {prescription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5" />
                    Prescription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">Prescription #{prescription.prescription_number}</p>
                    <p className="text-muted-foreground">
                      {format(new Date(prescription.created_at), 'PPP')}
                    </p>
                  </div>
                  
                  {prescription.diagnosis && (
                    <div>
                      <p className="font-medium text-sm mb-1">Diagnosis:</p>
                      <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-sm mb-2">Medications:</p>
                    <div className="space-y-2">
                      {prescription.medications && Array.isArray(prescription.medications) &&
                       prescription.medications.map((med: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-primary" />
                          <span className="text-sm">{med.name} - {med.dosage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {prescription.instructions && (
                    <div>
                      <p className="font-medium text-sm mb-1">Instructions:</p>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {isPatient 
                      ? "No prescription yet. Doctor will add if needed."
                      : "Add prescription when ready"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationChatPage;