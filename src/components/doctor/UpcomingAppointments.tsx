import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare, 
  ArrowRight,
  Stethoscope,
  Timer,
  User,
  MapPin
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, differenceInHours } from 'date-fns';

interface UpcomingAppointmentsProps {
  consultations: any[];
}

export function UpcomingAppointments({ consultations }: UpcomingAppointmentsProps) {
  const navigate = useNavigate();

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const getStatusBadge = (status: string, consultation?: any) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">
            <Video className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        if (consultation?.follow_up_expires_at) {
          const expiresAt = new Date(consultation.follow_up_expires_at);
          const isExpired = isPast(expiresAt);
          const hoursLeft = Math.max(0, differenceInHours(expiresAt, new Date()));
          
          if (isExpired) {
            return <Badge className="bg-gray-500 hover:bg-gray-600">Follow-up Closed</Badge>;
          } else {
            return (
              <Badge className="bg-green-500 hover:bg-green-600">
                <Timer className="h-3 w-3 mr-1" />
                Follow-up ({hoursLeft}h left)
              </Badge>
            );
          }
        }
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
        return <Video className="h-3 w-3" />;
      case 'audio':
        return <Phone className="h-3 w-3" />;
      case 'text':
        return <MessageSquare className="h-3 w-3" />;
      default:
        return <Video className="h-3 w-3" />;
    }
  };

  const handleConsultationClick = (consultationId: string) => {
    navigate(`/doctor/consultation/${consultationId}`);
  };

  const getPriorityColor = (consultation: any) => {
    if (consultation.status === 'in_progress') return 'border-l-orange-500';
    if (consultation.status === 'scheduled' && isToday(new Date(consultation.consultation_date))) return 'border-l-blue-500';
    if (consultation.follow_up_expires_at && !isPast(new Date(consultation.follow_up_expires_at))) return 'border-l-green-500';
    return 'border-l-gray-200';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Stethoscope className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Priority sorted • {consultations.length} consultations
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/doctor/appointments')}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardHeader>
      <CardContent>
        {consultations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-lg mb-2">No consultations scheduled</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Your appointment calendar is clear. Patients can book consultations during your available hours.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.slice(0, 6).map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => handleConsultationClick(consultation.id)}
                className={`group flex items-center justify-between p-4 rounded-lg border-l-4 ${getPriorityColor(consultation)} hover:shadow-md cursor-pointer transition-all duration-200 hover:bg-muted/30`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={consultation.profiles?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {consultation.profiles?.full_name ? consultation.profiles.full_name.split(' ').map((n: string) => n[0]).join('') : 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-base truncate">
                        {consultation.profiles?.full_name || 'Unknown Patient'}
                      </h4>
                      {consultation.is_new_patient && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {getDateLabel(consultation.consultation_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {consultation.time_slot}
                      </span>
                      <span className="flex items-center gap-1 capitalize">
                        {getConsultationTypeIcon(consultation.consultation_type)}
                        {consultation.consultation_type}
                      </span>
                    </div>
                    {consultation.patient_notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        📝 {consultation.patient_notes}
                      </p>
                    )}
                    {consultation.patient_age && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {consultation.patient_age} years old
                        {consultation.patient_location && (
                          <>
                            <MapPin className="h-3 w-3 ml-2" />
                            {consultation.patient_location}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(consultation.status, consultation)}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}