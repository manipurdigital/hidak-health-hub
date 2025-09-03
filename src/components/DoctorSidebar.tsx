import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  FileText, 
  LayoutDashboard, 
  Settings, 
  User,
  LogOut,
  Stethoscope,
  MessageSquare,
  BarChart3,
  Bell,
  Users
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Appointments', href: '/doctor/appointments', icon: Calendar, badge: null },
  { name: 'Availability', href: '/doctor/availability', icon: Clock, badge: null },
  { name: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText, badge: null },
  { name: 'Patients', href: '/doctor/patients', icon: Users, badge: null },
  { name: 'Messages', href: '/doctor/messages', icon: MessageSquare, badge: 3 },
  { name: 'Analytics', href: '/doctor/analytics', icon: BarChart3, badge: null },
  { name: 'Notifications', href: '/doctor/notifications', icon: Bell, badge: 2 },
  { name: 'Profile', href: '/doctor/profile', icon: User, badge: null },
  { name: 'Settings', href: '/doctor/settings', icon: Settings, badge: null },
];

export function DoctorSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className={collapsed ? "w-14" : "w-64"}>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-base">Doctor Portal</h2>
              <p className="text-xs text-muted-foreground">Healthcare Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="font-medium">{item.name}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <Badge variant="destructive" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}