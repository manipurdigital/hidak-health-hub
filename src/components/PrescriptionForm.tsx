
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, User, Calendar, Loader2 } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export function PrescriptionForm() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { id: '1', name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  // Fetch consultation details
  const { data: consultation, isLoading: consultationLoading } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: async () => {
      if (!consultationId) throw new Error('No consultation ID');
      
      // Get consultation first
      const { data: consultationData, error: consultationError } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultationId)
        .single();

      if (consultationError) throw consultationError;
      
      // Get patient profile separately  
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('user_id', consultationData.patient_id)
        .single();

      // Combine the data
      return {
        ...consultationData,
        profiles: profileData || null
      };
    },
    enabled: !!consultationId,
  });

  // Create prescription mutation
  const createPrescriptionMutation = useMutation({
    mutationFn: async (prescriptionData: any) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(prescriptionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
      navigate('/doctor/prescriptions');
    },
    onError: (error: any) => {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      });
    },
  });

  const addMedication = () => {
    const newId = (medications.length + 1).toString();
    setMedications([...medications, {
      id: newId,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consultation) {
      toast({
        title: "Error",
        description: "Consultation data not found",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!diagnosis.trim()) {
      toast({
        title: "Error",
        description: "Diagnosis is required",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty medications
    const validMedications = medications.filter(med => med.name.trim());
    
    if (validMedications.length === 0) {
      toast({
        title: "Error",
        description: "At least one medication is required",
        variant: "destructive",
      });
      return;
    }

    // Generate prescription number
    const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const prescriptionData = {
      prescription_number: prescriptionNumber,
      doctor_id: user?.id, // Will be updated in the mutation function
      patient_id: consultation.patient_id,
      consultation_id: consultationId,
      prescription_data: {
        diagnosis: diagnosis.trim(),
        instructions: instructions.trim(),
        medications: validMedications,
        follow_up_date: followUpDate || null,
        created_date: new Date().toISOString(),
        patient_info: {
          name: consultation.profiles?.full_name || 'N/A',
          phone: consultation.profiles?.phone || 'N/A',
          email: consultation.profiles?.email || 'N/A'
        }
      },
      status: 'active'
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  if (consultationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Consultation not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/doctor/prescriptions')}
          className="mt-4"
        >
          Back to Prescriptions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Prescription</h1>
          <p className="text-muted-foreground">Create a new prescription for this consultation</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/doctor/prescriptions')}
        >
          Back to Prescriptions
        </Button>
      </div>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient Name</Label>
              <p className="text-sm">{consultation.profiles?.full_name || consultation.profiles?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm">{consultation.profiles?.phone || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Consultation Date</Label>
              <p className="text-sm">
                {new Date(consultation.consultation_date).toLocaleDateString()} at {consultation.consultation_time}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diagnosis */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter diagnosis..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Medications
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMedication}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medication
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {medications.map((medication, index) => (
                <div key={medication.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Medication {index + 1}</Badge>
                    {medications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(medication.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`med-name-${medication.id}`}>Medicine Name *</Label>
                      <Input
                        id={`med-name-${medication.id}`}
                        placeholder="e.g., Paracetamol"
                        value={medication.name}
                        onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-dosage-${medication.id}`}>Dosage *</Label>
                      <Input
                        id={`med-dosage-${medication.id}`}
                        placeholder="e.g., 500mg"
                        value={medication.dosage}
                        onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-frequency-${medication.id}`}>Frequency *</Label>
                      <Input
                        id={`med-frequency-${medication.id}`}
                        placeholder="e.g., Twice daily"
                        value={medication.frequency}
                        onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`med-duration-${medication.id}`}>Duration *</Label>
                      <Input
                        id={`med-duration-${medication.id}`}
                        placeholder="e.g., 5 days"
                        value={medication.duration}
                        onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`med-instructions-${medication.id}`}>Instructions</Label>
                    <Input
                      id={`med-instructions-${medication.id}`}
                      placeholder="e.g., Take after meals"
                      value={medication.instructions}
                      onChange={(e) => updateMedication(medication.id, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* General Instructions & Follow-up */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="instructions">General Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="General instructions for the patient..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="follow-up-date">Follow-up Date (Optional)</Label>
              <Input
                id="follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/doctor/prescriptions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPrescriptionMutation.isPending}
          >
            {createPrescriptionMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Prescription'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
