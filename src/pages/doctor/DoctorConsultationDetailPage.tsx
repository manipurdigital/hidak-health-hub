
// @ts-nocheck
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Video,
  User,
  Stethoscope,
  Timer,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInHours, isPast } from 'date-fns';
import { VideoConsultation } from '@/components/VideoConsultation';

interface ConsultationDetail {
  id: string;
  patient_id: string;
  consultation_date: string;
  time_slot: string;
  status: string;
  consultation_type: string;
  patient_notes: string;
  notes: string;
  total_amount: number;
  created_at: string;
  completed_at: string | null;
  follow_up_expires_at: string | null;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function DoctorConsultationDetailPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-detail', consultationId],
    queryFn: async () => {
      if (!consultationId) throw new Error('Consultation ID required');

      const { data: consultationData, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (error) throw error;

      // Fetch patient profile separately to avoid join errors
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', consultationData.patient_id)
        .maybeSingle();

      let finalProfile = profile;
      
      // Extract patient details from patient_notes if profile incomplete
      if (!profile?.full_name && consultationData.patient_notes) {
        const extractPatientInfo = (notes: string) => {
          const patterns = {
            name: /Patient:\s*([^,]+)/i,
            phone: /Phone:\s*([^,]+)/i,
            email: /Email:\s*([^,]+)/i
          };
          
          const nameMatch = notes.match(patterns.name);
          const phoneMatch = notes.match(patterns.phone);
          const emailMatch = notes.match(patterns.email);
          
          return {
            full_name: nameMatch ? nameMatch[1].trim() : 'Unknown Patient',
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            email: emailMatch ? emailMatch[1].trim() : ''
          };
        };
        
        finalProfile = extractPatientInfo(consultationData.patient_notes);
      }

      const data = {
        ...consultationData,
        profiles: finalProfile || { full_name: 'Unknown Patient', phone: '', email: '' }
      };

      const consultation = data as unknown as ConsultationDetail;

      setDoctorNotes(consultation.notes || '');
      return consultation;
    },
    enabled: !!consultationId,
  });

  // Query for patient message count in follow-up window
  const { data: patientMessageCount = 0 } = useQuery({
    queryKey: ['patient-message-count', consultationId, consultation?.completed_at],
    queryFn: async () => {
      if (!consultationId || !consultation?.completed_at) return 0;

      const { count, error } = await supabase
        .from('consultation_messages')
        .select('*', { count: 'exact', head: true })
        .eq('consultation_id', consultationId)
        .eq('sender_type', 'patient')
        .gte('sent_at', consultation.completed_at);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!consultationId && !!consultation?.completed_at,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) updateData.notes = notes;

      const { error } = await supabase
        .from('consultations')
        .update(updateData)
        .eq('id', consultationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation-detail', consultationId] });
      queryClient.invalidateQueries({ queryKey: ['doctor-upcoming-consultations'] });
      toast({
        title: "Success",
        description: "Consultation updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ status });
  };

  const handleSaveNotes = () => {
    setIsUpdatingNotes(true);
    updateStatusMutation.mutate({ 
      status: consultation?.status || 'scheduled', 
      notes: doctorNotes 
    });
    setIsUpdatingNotes(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default"><Video className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Phone className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Consultation not found</p>
        <Button onClick={() => navigate('/doctor/dashboard')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Consultation Details</h1>
          <p className="text-muted-foreground">
            {format(new Date(consultation.consultation_date), 'MMMM dd, yyyy')} at {consultation.time_slot}
          </p>
        </div>
      </div>

      {/* Follow-up Window Status */}
      {consultation.status === 'completed' && followUpInfo && (
        <Card className={`border-l-4 ${followUpInfo.isExpired ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Timer className={`h-5 w-5 ${followUpInfo.isExpired ? 'text-red-600' : 'text-blue-600'}`} />
              <div>
                <h3 className="font-medium">
                  {followUpInfo.isExpired ? 'Follow-up Window Closed' : 'Follow-up Window Active'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {followUpInfo.isExpired ? (
                    `Closed on ${format(followUpInfo.expiresAt, 'MMM dd, yyyy HH:mm')}`
                  ) : (
                    <>
                      {followUpInfo.hoursLeft > 0 ? `${followUpInfo.hoursLeft} hours remaining` : 'Less than 1 hour remaining'} • 
                      Patient has {followUpInfo.patientMessagesLeft} messages left
                    </>
                  )}
                </p>
              </div>
              {followUpInfo.isExpired && (
                <AlertCircle className="h-4 w-4 text-red-600 ml-auto" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {consultation.profiles?.full_name ? consultation.profiles.full_name.split(' ').map(n => n[0]).join('') : 'UN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{consultation.profiles.full_name}</h3>
                <p className="text-sm text-muted-foreground">Patient</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{consultation.profiles.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{consultation.profiles.email}</span>
              </div>
            </div>

            {consultation.patient_notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Patient's Note</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {consultation.patient_notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Consultation Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date & Time</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(consultation.consultation_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{consultation.time_slot}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status & Type</Label>
                <div>{getStatusBadge(consultation.status)}</div>
                <div className="flex items-center gap-2">
                  {getConsultationTypeIcon(consultation.consultation_type)}
                  <span className="text-sm capitalize">{consultation.consultation_type}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Consultation Fee</Label>
              <p className="text-lg font-semibold">₹{consultation.total_amount}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label htmlFor="doctor-notes" className="text-sm font-medium">
                Doctor's Notes
              </Label>
              <Textarea
                id="doctor-notes"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Add your consultation notes, diagnosis, recommendations..."
                rows={6}
              />
              <Button 
                onClick={handleSaveNotes} 
                disabled={isUpdatingNotes}
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
            </div>

            <Separator />

            <div className="flex gap-2 flex-wrap items-center">
              {consultation.status === 'scheduled' && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updateStatusMutation.isPending}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Consultation
                </Button>
              )}
              
              <Button
                onClick={() => { setVideoError(null); setIsVideoCallActive(true); }}
                variant="default"
              >
                <Video className="h-4 w-4 mr-2" />
                {isVideoCallActive ? 'Call Active' : 'Start Video Call'}
              </Button>
              {isVideoCallActive && (
                <Button variant="destructive" onClick={() => setIsVideoCallActive(false)}>
                  End Call
                </Button>
              )}
              {videoError && (
                <span className="text-sm text-red-600">{videoError}</span>
              )}
              
              {consultation.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusChange('completed')}
                  disabled={updateStatusMutation.isPending}
                >
                  Complete Consultation
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(`/consultation/${consultation.id}/chat`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {consultation.status === 'completed' && followUpInfo?.isExpired ? 'View Chat History' : 'Open Chat'}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/doctor/prescriptions')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Prescription
              </Button>
            </div>

            {/* Inline video consultation UI */}
            <VideoConsultation
              consultationId={consultation.id}
              isActive={isVideoCallActive}
              onEnd={() => setIsVideoCallActive(false)}
              onError={(err) => setVideoError(err)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
