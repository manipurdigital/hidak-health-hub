import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ClipboardList, 
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

const centerSidebarItems = [
  { title: "Dashboard", url: "/center/dashboard", icon: Home },
  { title: "Lab Bookings", url: "/center/jobs", icon: ClipboardList },
];

export function CenterSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Center Console</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {centerSidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        isActive ? "bg-muted text-primary font-medium flex items-center" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center"
                      }
                    >
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