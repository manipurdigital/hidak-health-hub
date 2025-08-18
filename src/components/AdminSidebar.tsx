import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Pill, 
  ClipboardList, 
  Stethoscope,
  Users,
  Home
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
} from "@/components/ui/sidebar";

const adminSidebarItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Medicines", url: "/admin/medicines", icon: Pill },
  { title: "Lab Tests", url: "/admin/lab-tests", icon: ClipboardList },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Users", url: "/admin/users", icon: Users },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Console</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {adminSidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}