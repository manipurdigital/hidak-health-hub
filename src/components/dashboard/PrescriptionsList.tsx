import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  consultation_id: string;
  prescription_data: any;
  status: string;
  created_at: string;
}

const PrescriptionsList = () => {
  const { user } = useAuth();

  const { data: prescriptions = [], isLoading, error } = useQuery({
    queryKey: ['user-prescriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleDownload = (prescriptionId: string) => {
    // TODO: Implement prescription download functionality
    console.log(`Downloading prescription: ${prescriptionId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Digital Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-3" />
                <Skeleton className="h-3 w-64" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Digital Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No prescriptions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your digital prescriptions will appear here after consultations
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Digital Prescriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">Prescription #{prescription.id.substring(0, 8)}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="w-4 h-4" />
                    <span>Doctor ID: {prescription.doctor_id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(prescription.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Prescription Data:</p>
                <p className="mb-2">
                  {typeof prescription.prescription_data === 'object' 
                    ? JSON.stringify(prescription.prescription_data).substring(0, 100) + '...'
                    : prescription.prescription_data || 'No data available'
                  }
                </p>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Issued on {new Date(prescription.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionsList;