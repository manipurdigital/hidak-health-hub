import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Pill, 
  ClipboardList, 
  Stethoscope,
  Users,
  Home,
  BarChart3,
  MapPin,
  Map,
  Building2,
  TestTube,
  DollarSign,
  Tags,
  FileText
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
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "Medicines", url: "/admin/medicines", icon: Pill },
  { title: "Lab Tests", url: "/admin/lab-tests", icon: ClipboardList },
  { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Partner Applications", url: "/admin/partner-applications", icon: FileText },
  { title: "Lab Assignments", url: "/admin/lab-assignments", icon: ClipboardList },
  { title: "Delivery Assignments", url: "/admin/delivery-assignments", icon: MapPin },
  { title: "Tracking", url: "/admin/tracking", icon: MapPin },
  { title: "Geofencing", url: "/admin/geofencing", icon: Map },
  { title: "Locations", url: "/admin/locations", icon: Building2 },
  { title: "Tracking Test", url: "/admin/tracking-test", icon: TestTube },
  { title: "Payment Reconciliation", url: "/admin/reports/reconciliation", icon: DollarSign },
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