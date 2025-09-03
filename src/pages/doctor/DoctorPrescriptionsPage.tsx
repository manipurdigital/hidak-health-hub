
// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, User, Calendar, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface Prescription {
  id: string;
  prescription_number: string;
  doctor_id: string;
  patient_id: string;
  consultation_id: string;
  prescription_data: any;
  status: string;
  created_at: string;
  consultations?: {
    consultation_date: string;
    time_slot: string;
    patient_id: string;
    profiles?: {
      full_name: string;
      phone: string;
      email: string;
    };
  };
}

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch doctor's prescriptions
  const { data: prescriptions = [], isLoading, error } = useQuery({
    queryKey: ['doctor-prescriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get doctor info
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) {
        console.error('Doctor lookup error:', doctorError);
        return [];
      }
      if (!doctorInfo) return [];

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          consultations(
            consultation_date,
            time_slot,
            patient_id
          )
        `)
        .eq('doctor_id', doctorInfo.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Prescriptions fetch error:', error);
        return [];
      }
      
      // Get patient profiles for the prescriptions
      const prescriptionsWithProfiles = await Promise.all(
        (data || []).map(async (prescription) => {
          if (prescription.consultations?.patient_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, phone, email')
              .eq('user_id', prescription.consultations.patient_id)
              .single();
            
            return {
              ...prescription,
              consultations: {
                ...prescription.consultations,
                profiles: profile
              }
            };
          }
          return prescription;
        })
      );

      return prescriptionsWithProfiles;
    },
    enabled: !!user?.id,
  });

  // Fetch recent consultations for quick prescription creation
  const { data: recentConsultations = [] } = useQuery({
    queryKey: ['recent-consultations-for-prescriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get doctor info
      const { data: doctorInfo, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (doctorError) {
        console.error('Doctor lookup error for consultations:', doctorError);
        return [];
      }
      if (!doctorInfo) return [];

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          id,
          consultation_date,
          time_slot,
          status,
          patient_id
        `)
        .eq('doctor_id', doctorInfo.id)
        .in('status', ['completed', 'in_progress'])
        .order('consultation_date', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Consultations fetch error:', error);
        return [];
      }

      // Get patient profiles for the consultations
      const consultationsWithProfiles = await Promise.all(
        (data || []).map(async (consultation) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', consultation.patient_id)
            .single();
          
          return {
            ...consultation,
            profiles: profile
          };
        })
      );

      return consultationsWithProfiles;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleCreatePrescription = (consultationId?: string) => {
    if (consultationId) {
      navigate(`/doctor/prescriptions/create/${consultationId}`);
    } else {
      // Navigate to a page where doctor can select a consultation first
      navigate('/doctor/prescriptions/select-consultation');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and view all prescriptions</p>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and view all prescriptions</p>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">Error Loading Prescriptions</h3>
            <p className="text-muted-foreground">
              There was an error loading your prescriptions. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">Manage and view all prescriptions</p>
        </div>
        <Button onClick={() => handleCreatePrescription()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Prescription
        </Button>
      </div>

      {/* Quick Create from Recent Consultations */}
      {recentConsultations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Create from Recent Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{consultation.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(consultation.consultation_date).toLocaleDateString()} at {consultation.time_slot}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreatePrescription(consultation.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No Prescriptions Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any prescriptions yet. Create your first prescription for a consultation.
            </p>
            <Button onClick={() => handleCreatePrescription()}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Prescription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{prescription.prescription_number}</h4>
                      <Badge className={getStatusColor(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{prescription.consultations?.profiles?.full_name || 'Unknown Patient'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {prescription.consultations ? 
                            `${new Date(prescription.consultations.consultation_date).toLocaleDateString()} at ${prescription.consultations.time_slot}` :
                            new Date(prescription.created_at).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {prescription.prescription_data && (
                    <>
                      {prescription.prescription_data.diagnosis && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Diagnosis:</p>
                          <p className="text-sm">{prescription.prescription_data.diagnosis}</p>
                        </div>
                      )}
                      
                      {prescription.prescription_data.medications && Array.isArray(prescription.prescription_data.medications) && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Medications:</p>
                          <div className="text-sm">
                            {prescription.prescription_data.medications.map((med: any, index: number) => (
                              <span key={index} className="inline-block mr-2 mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {med.name} - {med.dosage}
                                </Badge>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {prescription.prescription_data.instructions && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Instructions:</p>
                          <p className="text-sm">{prescription.prescription_data.instructions}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-3">
                  Created on {new Date(prescription.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
