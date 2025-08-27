import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  TrendingUp,
  Activity,
  MessageSquare,
  ArrowRight,
  Stethoscope,
  FileText
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useDoctorUpcomingConsultations, useDoctorInfo } from '@/hooks/use-doctor-upcoming';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  
  const { data: doctorInfo, isLoading: doctorLoading } = useDoctorInfo();
  const { data: upcomingConsultations = [], isLoading: consultationsLoading } = useDoctorUpcomingConsultations();

  const isLoading = doctorLoading || consultationsLoading;

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

  // Quick stats
  const todayConsultations = upcomingConsultations.filter(c => 
    isToday(new Date(c.consultation_date))
  );
  const inProgressCount = upcomingConsultations.filter(c => c.status === 'in_progress').length;
  const scheduledCount = upcomingConsultations.filter(c => c.status === 'scheduled').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Good morning, Dr. {doctorInfo?.full_name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Here's what's happening with your practice today</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => navigate('/doctor/profile')}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button 
            onClick={() => navigate('/doctor/availability')}
            variant="outline"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Availability
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{todayConsultations.length}</div>
            <p className="text-xs text-blue-700 mt-1">
              {todayConsultations.filter(c => c.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{inProgressCount}</div>
            <p className="text-xs text-orange-700 mt-1">Active consultations</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{scheduledCount}</div>
            <p className="text-xs text-green-700 mt-1">Next 7 days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {doctorInfo?.rating ? `${doctorInfo.rating.toFixed(1)}★` : 'N/A'}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              {doctorInfo?.review_count || 0} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments - Priority Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Next 7 days • {upcomingConsultations.length} appointments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/doctor/appointments')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
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
              {upcomingConsultations.slice(0, 5).map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={() => handleConsultationClick(consultation.id)}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {consultation.profiles.full_name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{consultation.profiles.full_name}</h4>
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
                          {consultation.consultation_type === 'video' && <Video className="h-3 w-3" />}
                          {consultation.consultation_type === 'audio' && <MessageSquare className="h-3 w-3" />}
                          {consultation.consultation_type === 'text' && <MessageSquare className="h-3 w-3" />}
                          {consultation.consultation_type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(consultation.status)}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/appointments')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Manage Appointments</h3>
                <p className="text-sm text-muted-foreground">View and manage all consultations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/prescriptions')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Prescriptions</h3>
                <p className="text-sm text-muted-foreground">Create and manage prescriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/availability')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Set Availability</h3>
                <p className="text-sm text-muted-foreground">Update your working hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}