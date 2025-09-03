import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Pill,
  Activity
} from 'lucide-react';

interface QuickActionsProps {
  pendingCount?: number;
  unreadMessages?: number;
  availabilityStatus?: 'available' | 'busy' | 'offline';
}

export function QuickActions({ 
  pendingCount = 0, 
  unreadMessages = 0, 
  availabilityStatus = 'available' 
}: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Manage Appointments',
      description: 'View and manage all consultations',
      icon: Calendar,
      color: 'blue',
      onClick: () => navigate('/doctor/appointments'),
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      title: 'Set Availability',
      description: 'Update your working hours',
      icon: Clock,
      color: 'purple',
      onClick: () => navigate('/doctor/availability'),
      badge: availabilityStatus === 'offline' ? 'Offline' : null
    },
    {
      title: 'Prescriptions',
      description: 'Create and manage prescriptions',
      icon: FileText,
      color: 'green',
      onClick: () => navigate('/doctor/prescriptions')
    },
    {
      title: 'Patient Messages',
      description: 'Chat with patients',
      icon: MessageSquare,
      color: 'orange',
      onClick: () => navigate('/doctor/messages'),
      badge: unreadMessages > 0 ? unreadMessages : null
    },
    {
      title: 'My Profile',
      description: 'Update professional information',
      icon: User,
      color: 'indigo',
      onClick: () => navigate('/doctor/profile')
    },
    {
      title: 'Analytics',
      description: 'View practice insights',
      icon: BarChart3,
      color: 'emerald',
      onClick: () => navigate('/doctor/analytics')
    },
    {
      title: 'Notifications',
      description: 'Manage alerts and reminders',
      icon: Bell,
      color: 'red',
      onClick: () => navigate('/doctor/notifications')
    },
    {
      title: 'Settings',
      description: 'Configure your preferences',
      icon: Settings,
      color: 'gray',
      onClick: () => navigate('/doctor/settings')
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
      indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
      emerald: 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200',
      red: 'bg-red-100 text-red-600 hover:bg-red-200',
      gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge 
            variant={availabilityStatus === 'available' ? 'default' : 'secondary'}
            className={
              availabilityStatus === 'available' 
                ? 'bg-green-500 hover:bg-green-600' 
                : availabilityStatus === 'busy'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-500 hover:bg-gray-600'
            }
          >
            {availabilityStatus.charAt(0).toUpperCase() + availabilityStatus.slice(1)}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:scale-105"
            onClick={action.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg transition-colors ${getColorClasses(action.color)}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                {action.badge && (
                  <Badge variant="destructive" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}