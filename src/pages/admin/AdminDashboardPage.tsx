import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import { 
  User, 
  LogOut,
  Pill,
  ClipboardList,
  Stethoscope,
  Users,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { BackToHome } from '@/components/BackToHome';
import { CollectionsTodayWidget } from '@/components/dashboard/CollectionsTodayWidget';

const AdminDashboardPage = () => {
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

  const adminStats = [
    {
      title: "Total Medicines",
      value: "1,247",
      icon: Pill,
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Lab Tests Available", 
      value: "89",
      icon: ClipboardList,
      change: "+5%",
      changeType: "positive"
    },
    {
      title: "Active Doctors",
      value: "156",
      icon: Stethoscope,
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Total Users",
      value: "12,543",
      icon: Users,
      change: "+18%",
      changeType: "positive"
    }
  ];

  const recentActivity = [
    { action: "New doctor registered", user: "Dr. Sarah Wilson", time: "2 hours ago" },
    { action: "Medicine stock updated", user: "Admin", time: "4 hours ago" },
    { action: "Lab test added", user: "Lab Manager", time: "6 hours ago" },
    { action: "User account verified", user: "System", time: "1 day ago" }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary text-primary-foreground border-b flex items-center px-4">
          <SidebarTrigger className="mr-4" />
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Console</h1>
                <p className="text-primary-foreground/80 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <BackToHome variant="link" showIcon={false} text="Back to Site" className="text-primary-foreground hover:text-primary-foreground/80" />
              <Badge variant="secondary" className="capitalize bg-yellow-100 text-yellow-800">
                {userRole}
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
        </header>

        <AdminSidebar />

        <main className="flex-1 pt-16 p-6 bg-background">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Collections Today Widget */}
            <CollectionsTodayWidget />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Admin Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">by {activity.user} • {activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Pill className="w-4 h-4 mr-2" />
                      Add New Medicine
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Create Lab Test
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Stethoscope className="w-4 h-4 mr-2" />
                      Verify Doctor
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardPage;