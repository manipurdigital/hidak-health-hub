
// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function DoctorSelectConsultationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['consultations-for-prescription', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get doctor info
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) throw doctorError;
      if (!doctorInfo) return [];

      // Fetch consultations without join
      const { data: consultationsData, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('doctor_id', doctorInfo.id)
        .in('status', ['completed', 'in_progress', 'scheduled'])
        .order('consultation_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!consultationsData?.length) return [];

      // Get unique patient IDs
      const patientIds = [...new Set(consultationsData.map(c => c.patient_id).filter(Boolean))];
      
      // Batch fetch patient profiles
      const { data: profiles = [] } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .in('user_id', patientIds);

      // Map profiles to consultations
      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      
      return consultationsData.map(consultation => ({
        ...consultation,
        profiles: profilesMap.get(consultation.patient_id) || null
      }));
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/prescriptions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Select Consultation</h1>
            <p className="text-muted-foreground">Choose a consultation to create a prescription for</p>
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-3" />
                <Skeleton className="h-3 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/prescriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Select Consultation</h1>
          <p className="text-muted-foreground">Choose a consultation to create a prescription for</p>
        </div>
      </div>

      {consultations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No Consultations Found</h3>
            <p className="text-muted-foreground">
              You don't have any recent consultations to create prescriptions for.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consultations.map((consultation) => (
            <Card key={consultation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{consultation.profiles?.full_name || 'Unknown Patient'}</span>
                        {consultation.profiles?.phone && (
                          <span className="text-sm text-muted-foreground">
                            ({consultation.profiles.phone})
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(consultation.consultation_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{consultation.time_slot}</span>
                        </div>
                      </div>

                      {consultation.patient_notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Patient Notes:</p>
                          <p className="text-sm">{consultation.patient_notes}</p>
                        </div>
                      )}

                      {consultation.notes && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Doctor Notes:</p>
                          <p className="text-sm">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate(`/doctor/prescriptions/create/${consultation.id}`)}
                  >
                    Create Prescription
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
