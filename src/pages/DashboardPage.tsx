import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  Heart, 
  Settings,
  LogOut,
  ClipboardList,
  Stethoscope,
  Pill
} from 'lucide-react';

const DashboardPage = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const quickActions = [
    {
      title: "My Orders",
      description: "Track medicine deliveries",
      icon: ShoppingBag,
      count: 3,
      action: () => toast({ title: "My Orders", description: "Opening orders page..." })
    },
    {
      title: "My Tests",
      description: "Lab reports & bookings",
      icon: ClipboardList,
      count: 2,
      action: () => toast({ title: "My Tests", description: "Opening lab tests..." })
    },
    {
      title: "My Consultations",
      description: "Doctor appointments",
      icon: Stethoscope,
      count: 1,
      action: () => toast({ title: "Consultations", description: "Opening consultations..." })
    },
    {
      title: "My Prescriptions",
      description: "Digital prescriptions",
      icon: Pill,
      count: 5,
      action: () => toast({ title: "Prescriptions", description: "Opening prescriptions..." })
    }
  ];

  const recentActivity = [
    { type: "order", title: "Paracetamol 500mg delivered", time: "2 hours ago" },
    { type: "test", title: "Blood test results available", time: "1 day ago" },
    { type: "consultation", title: "Video call with Dr. Smith", time: "3 days ago" },
    { type: "prescription", title: "New prescription added", time: "1 week ago" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-primary-foreground/80">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize">
                {userRole || 'user'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <action.icon className="w-8 h-8 text-primary" />
                    {action.count > 0 && (
                      <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Health</span>
                    <Badge variant="outline" className="bg-success/20 text-success border-success">
                      Good
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Medications</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Upcoming Appointments</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Lab Results</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast({ title: "Profile", description: "Opening profile settings..." })}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;