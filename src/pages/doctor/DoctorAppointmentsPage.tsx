import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Video, MessageSquare, ArrowRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useDoctorUpcomingConsultations } from '@/hooks/use-doctor-upcoming';

export default function DoctorAppointmentsPage() {
  const navigate = useNavigate();
  const { data: upcomingConsultations = [], isLoading } = useDoctorUpcomingConsultations();

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 border-blue-200"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-500 hover:bg-orange-600"><Video className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleConsultationClick = (consultationId: string) => {
    navigate(`/doctor/consultation/${consultationId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Appointments</h1>
        <p className="text-muted-foreground">View and manage all your consultations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Consultations ({upcomingConsultations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingConsultations.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No upcoming appointments</h3>
              <p className="text-muted-foreground">
                You have no scheduled consultations for the next 7 days.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={() => handleConsultationClick(consultation.id)}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {consultation.profiles?.full_name ? consultation.profiles.full_name.split(' ').map(n => n[0]).join('') : 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-lg">{consultation.profiles.full_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getDateLabel(consultation.consultation_date)} • {format(new Date(consultation.consultation_date), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {consultation.time_slot}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          {consultation.consultation_type === 'video' && <Video className="h-3 w-3" />}
                          {consultation.consultation_type === 'audio' && <MessageSquare className="h-3 w-3" />}
                          {consultation.consultation_type === 'text' && <MessageSquare className="h-3 w-3" />}
                          {consultation.consultation_type}
                        </span>
                      </div>
                      {consultation.patient_notes && (
                        <p className="text-sm text-muted-foreground mt-1 max-w-md truncate">
                          Patient notes: {consultation.patient_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {getStatusBadge(consultation.status)}
                      <p className="text-sm text-muted-foreground mt-1">
                        ₹{consultation.total_amount}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}