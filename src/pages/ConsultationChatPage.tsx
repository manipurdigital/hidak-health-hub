
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ConsultationChatWindow from '@/components/ConsultationChatWindow';

export default function ConsultationChatPage() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation-access', consultationId],
    queryFn: async () => {
      if (!consultationId) throw new Error('Consultation ID required');

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          profiles!consultations_patient_id_fkey(full_name),
          doctors(full_name, user_id)
        `)
        .eq('id', consultationId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!consultationId && !!user,
  });

  const isPatient = consultation?.patient_id === user?.id;
  const isDoctor = consultation?.doctors?.user_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!consultation || (!isPatient && !isDoctor)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don't have permission to view this consultation.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Consultation with {isPatient ? consultation.doctors?.full_name : consultation.profiles?.full_name}
          </h1>
          <p className="text-muted-foreground">
            {consultation.consultation_date} at {consultation.time_slot}
          </p>
        </div>
      </div>

      <ConsultationChatWindow 
        consultationId={consultationId!} 
        isPatient={isPatient}
      />
    </div>
  );
}
