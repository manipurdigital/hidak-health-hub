import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset 
} from "@/components/ui/sidebar";
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminLayout() {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Top Bar */}
        <header className="sticky top-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{user?.email}</span>
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}