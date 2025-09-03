
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Activity, 
  Heart, 
  FileText, 
  Settings,
  Filter,
  ArrowRight,
  Stethoscope,
  Timer,
  Users,
  Star
} from 'lucide-react';
import { format, addDays, isToday, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDoctorUpcomingConsultations, useDoctorInfo } from '@/hooks/use-doctor-upcoming';

type DateFilter = 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'next-7-days' | 'next-30-days' | 'custom';

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customDate, setCustomDate] = useState<Date>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: consultations = [], isLoading } = useDoctorUpcomingConsultations();
  const { data: doctorInfo } = useDoctorInfo();

  // Filter consultations based on selected date filter
  const getFilteredConsultations = () => {
    const now = new Date();
    let filtered = consultations;

    switch (dateFilter) {
      case 'today':
        filtered = consultations.filter(c => isToday(new Date(c.consultation_date)));
        break;
      case 'tomorrow':
        const tomorrow = addDays(now, 1);
        filtered = consultations.filter(c => 
          format(new Date(c.consultation_date), 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')
        );
        break;
      case 'this-week':
        // Current week logic
        break;
      case 'next-week':
        // Next week logic
        break;
      case 'next-7-days':
        const next7Days = addDays(now, 7);
        filtered = consultations.filter(c => {
          const consultDate = new Date(c.consultation_date);
          return consultDate >= now && consultDate <= next7Days;
        });
        break;
      case 'next-30-days':
        const next30Days = addDays(now, 30);
        filtered = consultations.filter(c => {
          const consultDate = new Date(c.consultation_date);
          return consultDate >= now && consultDate <= next30Days;
        });
        break;
      case 'custom':
        if (customDate) {
          filtered = consultations.filter(c => 
            format(new Date(c.consultation_date), 'yyyy-MM-dd') === format(customDate, 'yyyy-MM-dd')
          );
        }
        break;
      default:
        filtered = consultations;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.patient_notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredConsultations = getFilteredConsultations();

  // Calculate stats
  const todayConsultations = consultations.filter(c => isToday(new Date(c.consultation_date)));
  const completedToday = todayConsultations.filter(c => c.status === 'completed').length;
  const inProgressCount = consultations.filter(c => c.status === 'in_progress').length;
  const activeConsultationsCount = consultations.filter(c => c.status === 'scheduled').length;
  const followUpsCount = 0; // TODO: Implement follow-ups logic

  const dateFilterButtons = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'this-week', label: 'This Week' },
    { key: 'next-week', label: 'Next Week' },
    { key: 'next-7-days', label: 'Next 7 Days' },
    { key: 'next-30-days', label: 'Next 30 Days' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Good morning, Dr. {doctorInfo?.name || doctorInfo?.full_name || 'Doctor'}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your practice today
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/doctor/profile')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Profile
            </Button>
            <Button 
              onClick={() => navigate('/doctor/availability')}
              className="flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Availability
            </Button>
          </div>
        </div>

        {/* Filter Appointments by Date */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5" />
              <CardTitle>Filter Appointments by Date</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a specific date or date range to view appointments
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {dateFilterButtons.map((button) => (
                <Button
                  key={button.key}
                  variant={dateFilter === button.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter(button.key as DateFilter)}
                >
                  {button.label}
                </Button>
              ))}
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? "default" : "outline"}
                    size="sm"
                    className="w-auto justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? format(customDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => {
                      setCustomDate(date);
                      setDateFilter('custom');
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Search functionality */}
            <div className="relative">
              <Input
                placeholder="Search appointments by patient name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Today's Appointments</p>
                  <p className="text-3xl font-bold text-blue-900">{todayConsultations.length}</p>
                  <p className="text-xs text-blue-700">{completedToday} completed</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900 mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-orange-900">{inProgressCount}</p>
                  <p className="text-xs text-orange-700">Active consultations</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">Follow-ups Active</p>
                  <p className="text-3xl font-bold text-green-900">{followUpsCount}</p>
                  <p className="text-xs text-green-700">72-hour windows open</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Timer className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">Rating</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {doctorInfo?.rating ? `${doctorInfo.rating.toFixed(1)}★` : 'N/A'}
                  </p>
                  <p className="text-xs text-purple-700">{doctorInfo?.review_count || 0} reviews</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <CardTitle>Upcoming Appointments</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/doctor/appointments')}
                className="flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Priority sorted • {filteredConsultations.length} consultations
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No consultations found</h3>
                <p className="text-muted-foreground">
                  You have no consultations scheduled.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConsultations.slice(0, 5).map((consultation) => (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/doctor/consultations/${consultation.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{consultation.profiles?.full_name || 'Patient'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(consultation.consultation_date), 'MMM dd, yyyy')} at {consultation.time_slot}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={consultation.status === 'completed' ? 'default' : 'secondary'}>
                        {consultation.status}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Appointments</h3>
                  <p className="text-sm text-muted-foreground">View and manage all consultations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/prescriptions')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Prescriptions</h3>
                  <p className="text-sm text-muted-foreground">Create and manage prescriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctor/availability')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Set Availability</h3>
                  <p className="text-sm text-muted-foreground">Update your working hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
