import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  Activity, 
  Timer, 
  DollarSign,
  Heart,
  MessageCircle
} from 'lucide-react';
import { format, isToday, isPast, differenceInHours } from 'date-fns';

interface StatsCardsProps {
  doctorInfo?: any;
  upcomingConsultations?: any[];
}

export function DoctorStatsCards({ doctorInfo, upcomingConsultations = [] }: StatsCardsProps) {
  // Calculate stats
  const todayConsultations = upcomingConsultations.filter(c => 
    isToday(new Date(c.consultation_date))
  );
  const inProgressCount = upcomingConsultations.filter(c => c.status === 'in_progress').length;
  const scheduledCount = upcomingConsultations.filter(c => c.status === 'scheduled').length;
  const activeFollowUpCount = upcomingConsultations.filter(c => {
    if (c.status !== 'completed' || !c.follow_up_expires_at) return false;
    return !isPast(new Date(c.follow_up_expires_at));
  }).length;

  const completedToday = todayConsultations.filter(c => c.status === 'completed').length;
  const totalEarningsToday = completedToday * (doctorInfo?.consultation_fee || 0);
  const patientsSeen = upcomingConsultations.filter(c => c.status === 'completed').length;

  const stats = [
    {
      title: "Today's Appointments",
      value: todayConsultations.length,
      change: `${completedToday} completed`,
      icon: Calendar,
      color: 'blue',
      trend: completedToday > 0 ? 'up' : 'neutral'
    },
    {
      title: "Active Consultations",
      value: inProgressCount,
      change: `${scheduledCount} scheduled`,
      icon: Activity,
      color: 'orange',
      trend: inProgressCount > 0 ? 'up' : 'neutral'
    },
    {
      title: "Follow-ups Active",
      value: activeFollowUpCount,
      change: "72-hour windows",
      icon: Timer,
      color: 'green',
      trend: activeFollowUpCount > 0 ? 'up' : 'neutral'
    },
    {
      title: "Patient Rating",
      value: doctorInfo?.rating ? `${doctorInfo.rating.toFixed(1)}★` : 'N/A',
      change: `${doctorInfo?.review_count || 0} reviews`,
      icon: Heart,
      color: 'purple',
      trend: 'up'
    },
    {
      title: "Today's Earnings",
      value: `₹${totalEarningsToday.toLocaleString()}`,
      change: `${completedToday} consultations`,
      icon: DollarSign,
      color: 'emerald',
      trend: totalEarningsToday > 0 ? 'up' : 'neutral'
    },
    {
      title: "Patients Treated",
      value: patientsSeen,
      change: "All time",
      icon: Users,
      color: 'indigo',
      trend: 'up'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
      green: 'from-green-50 to-green-100 border-green-200 text-green-900',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
      emerald: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900',
      indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      orange: 'text-orange-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      emerald: 'text-emerald-600',
      indigo: 'text-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className={`bg-gradient-to-br ${getColorClasses(stat.color)} transition-all hover:shadow-md`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${getIconColor(stat.color)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-70">{stat.change}</p>
              {stat.trend === 'up' && (
                <TrendingUp className={`h-3 w-3 ${getIconColor(stat.color)}`} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}