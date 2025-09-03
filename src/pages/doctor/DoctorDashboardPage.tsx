
// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Bell,
  Plus,
  TrendingUp
} from 'lucide-react';
import { format, startOfDay, addDays } from 'date-fns';
import { useDoctorUpcomingConsultations, useDoctorInfo } from '@/hooks/use-doctor-upcoming';
import { DoctorStatsCards } from '@/components/doctor/DoctorStatsCards';
import { UpcomingAppointments } from '@/components/doctor/UpcomingAppointments';
import { QuickActions } from '@/components/doctor/QuickActions';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  
  const { data: doctorInfo, isLoading: doctorLoading } = useDoctorInfo();
  const { data: upcomingConsultations = [], isLoading: consultationsLoading } = useDoctorUpcomingConsultations();

  const isLoading = doctorLoading || consultationsLoading;

  // Get today's date for comparison
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  // Calculate some basic stats for quick actions
  const pendingCount = upcomingConsultations.filter(c => c.status === 'scheduled').length;
  const unreadMessages = 3; // This would come from your messaging system
  const availabilityStatus = doctorInfo?.is_available ? 'available' : 'offline';

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-10 bg-muted rounded w-80 mb-2"></div>
            <div className="h-5 bg-muted rounded w-96"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-muted rounded w-28"></div>
            <div className="h-10 bg-muted rounded w-36"></div>
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-6 w-6 bg-muted rounded"></div>
              </div>
              <div className="h-8 bg-muted rounded w-20 mb-2"></div>
              <div className="h-3 bg-muted rounded w-28"></div>
            </div>
          ))}
        </div>

        {/* Upcoming appointments skeleton */}
        <div className="border rounded-lg">
          <div className="p-6 border-b">
            <div className="h-6 bg-muted rounded w-56 mb-2"></div>
            <div className="h-4 bg-muted rounded w-72"></div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div>
                    <div className="h-5 bg-muted rounded w-40 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-56"></div>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-muted rounded-lg"></div>
                <div className="h-5 bg-muted rounded w-8"></div>
              </div>
              <div className="h-4 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get current time and greeting
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {getGreeting()}, Dr. {doctorInfo?.full_name ? doctorInfo.full_name.split(' ')[0] : 'Doctor'}
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Today is {format(new Date(), 'EEEE, MMMM do, yyyy')} • Here's your practice overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/doctor/profile')}
            variant="outline"
            className="hover:bg-primary hover:text-primary-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            My Profile
          </Button>
          <Button 
            onClick={() => navigate('/doctor/availability')}
            className="bg-primary hover:bg-primary/90"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Manage Schedule
          </Button>
          <Button 
            onClick={() => navigate('/doctor/appointments?action=new')}
            variant="outline"
            className="hover:bg-green-500 hover:text-white border-green-500 text-green-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <DoctorStatsCards 
        doctorInfo={doctorInfo} 
        upcomingConsultations={upcomingConsultations} 
      />

      {/* Upcoming Appointments */}
      <UpcomingAppointments consultations={upcomingConsultations} />

      {/* Quick Actions */}
      <QuickActions 
        pendingCount={pendingCount}
        unreadMessages={unreadMessages}
        availabilityStatus={availabilityStatus}
      />

      {/* Additional insights section could go here */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Practice Insights</h3>
              <p className="text-muted-foreground">
                You're doing great! Your patient satisfaction rate is above average.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <Button 
                variant="outline" 
                onClick={() => navigate('/doctor/analytics')}
              >
                View Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
