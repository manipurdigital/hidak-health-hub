import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, User, Phone, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  consultation_time: string;
  time_slot: string;
  consultation_type: string;
  consultation_fee: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  patient_notes?: string;
  doctor: {
    name: string;
    full_name: string;
    specialization: string;
  } | null;
  patient_profiles: {
    full_name: string;
    email: string;
  } | null;
}

interface ConsultationOrdersTabProps {
  filters: {
    from?: string;
    to?: string;
    status?: string;
    q?: string;
  };
}

const consultationStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const consultationStatuses = [
  "pending",
  "scheduled",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled"
];

export const ConsultationOrdersTab = ({ filters }: ConsultationOrdersTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Default to last 7 days instead of just today to catch more consultations
  const defaultFrom = filters.from || format(weekAgo, 'yyyy-MM-dd');
  const defaultTo = filters.to || format(today, 'yyyy-MM-dd');

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['admin-consultations', filters],
    queryFn: async () => {
      let query = supabase
        .from('consultations')
        .select(`
          *,
          doctor:doctors (
            name,
            full_name,
            specialization
          )
        `);

      // Apply date filters
      if (defaultFrom) {
        query = query.gte('created_at', `${defaultFrom}T00:00:00.000Z`);
      }
      if (defaultTo) {
        query = query.lte('created_at', `${defaultTo}T23:59:59.999Z`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters.q) {
        query = query.or(`id.ilike.%${filters.q}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching consultations:', error);
        throw error;
      }
      console.log('Fetched consultations:', data);
      
      // Fetch patient profiles separately
      if (data && data.length > 0) {
        const patientIds = data.map(c => c.patient_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', patientIds);
        
        // Map profiles to consultations
        const consultationsWithProfiles = data.map(consultation => ({
          ...consultation,
          patient_profiles: profiles?.find(p => p.user_id === consultation.patient_id) || null
        }));
        
        return consultationsWithProfiles;
      }
      
      return (data || []) as any[];
    }
  });

  const updateConsultationStatus = useMutation({
    mutationFn: async ({ consultationId, status }: { consultationId: string; status: string }) => {
      const { error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', consultationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-consultations'] });
      toast({
        title: "Status updated",
        description: "Consultation status has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update consultation status",
        variant: "destructive"
      });
    }
  });

  const formatConsultationDateTime = (date: string, time: string) => {
    const consultationDate = new Date(date);
    return {
      date: format(consultationDate, 'MMM dd, yyyy'),
      time: time
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Doctor Consultations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Details</TableHead>
              <TableHead>Doctor Details</TableHead>
              <TableHead>Consultation Date & Time</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultations?.map((consultation) => {
              const dateTime = formatConsultationDateTime(
                consultation.consultation_date, 
                consultation.time_slot || consultation.consultation_time
              );
              
              return (
                <TableRow key={consultation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {consultation.patient_profiles?.full_name || 'Unknown Patient'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {consultation.patient_profiles?.email}
                        </div>
                        {consultation.patient_notes && (
                          <div className="text-xs text-muted-foreground mt-1 italic">
                            Notes: {consultation.patient_notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {consultation.doctor?.full_name || consultation.doctor?.name || 'Unknown Doctor'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {consultation.doctor?.specialization || 'General Physician'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {dateTime.date}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {dateTime.time}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-medium">
                    ₹{consultation.consultation_fee || consultation.total_amount}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {consultation.consultation_type}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={consultation.status}
                      onValueChange={(status) => updateConsultationStatus.mutate({ 
                        consultationId: consultation.id, 
                        status 
                      })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue>
                          <Badge className={consultationStatusColors[consultation.status as keyof typeof consultationStatusColors] || "bg-gray-100 text-gray-800"}>
                            {consultation.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {consultationStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <Badge className={consultationStatusColors[status as keyof typeof consultationStatusColors] || "bg-gray-100 text-gray-800"}>
                              {status}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={consultation.payment_status === 'paid' ? 'default' : 'destructive'}
                    >
                      {consultation.payment_status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(consultation.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(consultation.created_at), 'hh:mm a')}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {!consultations?.length && (
          <div className="text-center py-8 text-muted-foreground">
            No consultations found for the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};