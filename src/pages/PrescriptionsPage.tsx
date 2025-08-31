// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, Calendar, Clock, MessageCircle, FileText, 
  Pill, User, Stethoscope, Filter, Search
} from 'lucide-react';

interface PrescriptionWithDetails {
  id: string;
  prescription_number: string;
  medications: any;
  diagnosis?: string;
  instructions?: string;
  created_at: string;
  status: string;
  consultation: {
    consultation_date: string;
    time_slot: string;
    doctor: {
      full_name: string;
      specialization: string;
    };
  };
}

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  useEffect(() => {
    filterPrescriptions();
  }, [prescriptions, searchTerm, statusFilter]);

  const fetchPrescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          consultation:consultations(
            consultation_date,
            time_slot,
            doctor:doctors(
              full_name,
              specialization
            )
          )
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPrescriptions = () => {
    let filtered = prescriptions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.consultation.doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medications && Array.isArray(prescription.medications) && 
        prescription.medications.some((med: any) => 
          med.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredPrescriptions(filtered);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to view your prescriptions</p>
            <Button onClick={() => navigate('/auth')}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Back to Home
          </Button>
          <h1 className="text-xl font-semibold">My Prescriptions</h1>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search prescriptions by number, doctor, diagnosis, or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'fulfilled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('fulfilled')}
              >
                Fulfilled
              </Button>
              <Button
                variant={statusFilter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('expired')}
              >
                Expired
              </Button>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
                        ))}
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {prescriptions.length === 0 ? 'No prescriptions yet' : 'No prescriptions found'}
            </h3>
            <p className="text-muted-foreground">
              {prescriptions.length === 0 
                ? 'Your digital prescriptions from consultations will appear here'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        Prescription #{prescription.prescription_number}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(prescription.created_at), 'PPP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Stethoscope className="w-4 h-4" />
                          {prescription.consultation.doctor.full_name}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        prescription.status === 'active' ? 'default' :
                        prescription.status === 'fulfilled' ? 'secondary' : 'destructive'
                      }
                    >
                      {prescription.status}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Doctor Details
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{prescription.consultation.doctor.full_name}</p>
                        <p className="text-muted-foreground">{prescription.consultation.doctor.specialization}</p>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>Date: {format(new Date(prescription.consultation.consultation_date), 'PP')}</span>
                          <span>Time: {prescription.consultation.time_slot}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Medications
                      </h4>
                      <div className="space-y-1">
                        {prescription.medications && Array.isArray(prescription.medications) && 
                         prescription.medications.map((medication: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{medication.name}</span>
                            {medication.dosage && (
                              <span className="text-muted-foreground"> - {medication.dosage}</span>
                            )}
                            {medication.frequency && (
                              <span className="text-muted-foreground"> ({medication.frequency})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {prescription.diagnosis && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-1">Diagnosis:</h4>
                      <p className="text-sm text-muted-foreground">{prescription.diagnosis}</p>
                    </div>
                  )}

                  {prescription.instructions && (
                    <div className="mt-3">
                      <h4 className="font-medium mb-1">Instructions:</h4>
                      <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionsPage;