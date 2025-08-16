import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MessageSquare, FileText, Plus, Edit2, Users, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Consultation {
  id: string;
  patient_id: string;
  consultation_date: string;
  time_slot: string;
  status: string;
  consultation_type: string;
  patient_notes: string;
  doctor_notes: string;
  profiles: {
    full_name: string;
    phone: string;
    email: string;
  };
}

interface DoctorAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Prescription {
  id: string;
  prescription_number: string;
  diagnosis: string;
  medications: any[];
  instructions: string;
  status: string;
  created_at: string;
  consultations: {
    profiles: {
      full_name: string;
    };
  };
}

export const DoctorDashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get doctor info
  const { data: doctorInfo } = useQuery({
    queryKey: ['doctor-info', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch consultations
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ['doctor-consultations', selectedDate, doctorInfo?.id],
    queryFn: async () => {
      if (!doctorInfo?.id) return [];

      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          profiles!consultations_patient_id_fkey(full_name, phone, email)
        `)
        .eq('doctor_id', doctorInfo.id)
        .eq('consultation_date', selectedDate)
        .order('time_slot');

      if (error) throw error;
      return data.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      })) as unknown as Consultation[];
    },
    enabled: !!doctorInfo?.id
  });

  // Fetch doctor availability
  const { data: availability = [] } = useQuery({
    queryKey: ['doctor-availability', doctorInfo?.id],
    queryFn: async () => {
      if (!doctorInfo?.id) return [];

      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorInfo.id)
        .order('day_of_week');

      if (error) throw error;
      return data as DoctorAvailability[];
    },
    enabled: !!doctorInfo?.id
  });

  // Fetch prescriptions
  const { data: prescriptions = [] } = useQuery({
    queryKey: ['doctor-prescriptions', doctorInfo?.id],
    queryFn: async () => {
      if (!doctorInfo?.id) return [];

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          consultations!inner(
            profiles!consultations_patient_id_fkey(full_name)
          )
        `)
        .eq('doctor_id', doctorInfo.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data.map(item => ({
        ...item,
        consultations: {
          profiles: Array.isArray(item.consultations) && item.consultations[0]?.profiles ? 
            (Array.isArray(item.consultations[0].profiles) ? item.consultations[0].profiles[0] : item.consultations[0].profiles) :
            { full_name: 'Unknown' }
        }
      })) as unknown as Prescription[];
    },
    enabled: !!doctorInfo?.id
  });

  // Update consultation status
  const updateConsultationMutation = useMutation({
    mutationFn: async ({ consultationId, status, notes }: { 
      consultationId: string; 
      status: string; 
      notes?: string;
    }) => {
      const updateData: any = { status };
      if (notes) updateData.doctor_notes = notes;

      const { error } = await supabase
        .from('consultations')
        .update(updateData)
        .eq('id', consultationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-consultations'] });
      toast({
        title: "Success",
        description: "Consultation updated"
      });
    }
  });

  // Create prescription
  const createPrescriptionMutation = useMutation({
    mutationFn: async (prescriptionData: {
      consultation_id: string;
      patient_id: string;
      diagnosis: string;
      medications: any[];
      instructions: string;
    }) => {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          ...prescriptionData,
          doctor_id: doctorInfo?.id,
          prescription_number: `RX-${Date.now()}` // Auto-generate prescription number
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
      setIsPrescriptionOpen(false);
      setSelectedConsultation(null);
      toast({
        title: "Success",
        description: "Prescription created successfully"
      });
    }
  });

  // Manage availability
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData: {
      day_of_week: number;
      start_time: string;
      end_time: string;
    }) => {
      // First, delete existing availability for this day
      await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctorInfo?.id)
        .eq('day_of_week', availabilityData.day_of_week);

      // Then insert new availability
      const { error } = await supabase
        .from('doctor_availability')
        .insert({
          doctor_id: doctorInfo?.id,
          ...availabilityData
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast({
        title: "Success",
        description: "Availability updated"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default"><Video className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStartConsultation = (consultation: Consultation) => {
    updateConsultationMutation.mutate({
      consultationId: consultation.id,
      status: 'in_progress'
    });
  };

  const handleCompleteConsultation = (consultation: Consultation) => {
    updateConsultationMutation.mutate({
      consultationId: consultation.id,
      status: 'completed'
    });
  };

  const handleCreatePrescription = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsPrescriptionOpen(true);
  };

  const handlePrescriptionSubmit = (formData: FormData) => {
    if (!selectedConsultation) return;

    const medications = [
      {
        name: formData.get('medication_name') as string,
        dosage: formData.get('dosage') as string,
        frequency: formData.get('frequency') as string,
        duration: formData.get('duration') as string
      }
    ];

    createPrescriptionMutation.mutate({
      consultation_id: selectedConsultation.id,
      patient_id: selectedConsultation.patient_id,
      diagnosis: formData.get('diagnosis') as string,
      medications,
      instructions: formData.get('instructions') as string
    });
  };

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Manage consultations and patient care</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Slots
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Availability</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{getDayName(slot.day_of_week)}</div>
                      <div className="text-sm text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </div>
                    <Badge variant={slot.is_active ? "default" : "outline"}>
                      {slot.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Consultations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consultations.filter(c => c.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div>
              <Label>Consultation Date</Label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consultation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Consultation Queue - {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{consultation.profiles.full_name}</div>
                      <div className="text-sm text-muted-foreground">{consultation.profiles.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {consultation.time_slot}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{consultation.consultation_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {consultation.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleStartConsultation(consultation)}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {consultation.status === 'in_progress' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreatePrescription(consultation)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Prescribe
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteConsultation(consultation)}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prescription #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="font-mono text-sm">
                    {prescription.prescription_number}
                  </TableCell>
                  <TableCell>
                    {prescription.consultations.profiles.full_name}
                  </TableCell>
                  <TableCell>{prescription.diagnosis}</TableCell>
                  <TableCell>
                    {format(new Date(prescription.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{prescription.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Prescription Dialog */}
      <Dialog open={isPrescriptionOpen} onOpenChange={setIsPrescriptionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Prescription</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handlePrescriptionSubmit(formData);
          }} className="space-y-4">
            <div>
              <Label>Patient</Label>
              <Input
                value={selectedConsultation?.profiles.full_name || ''}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                name="diagnosis"
                placeholder="Enter diagnosis..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medication_name">Medication</Label>
                <Input
                  id="medication_name"
                  name="medication_name"
                  placeholder="Medicine name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  name="dosage"
                  placeholder="e.g., 500mg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  name="frequency"
                  placeholder="e.g., 2 times daily"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  placeholder="e.g., 7 days"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                name="instructions"
                placeholder="Additional instructions for the patient..."
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={createPrescriptionMutation.isPending}>
                {createPrescriptionMutation.isPending ? 'Creating...' : 'Create Prescription'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPrescriptionOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};