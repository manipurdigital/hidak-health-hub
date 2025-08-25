import React, { useState } from 'react';
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
  FileText,
  Store,
  ChevronDown,
  Database,
  Download
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const adminSidebarGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
    ]
  },
  {
    label: "Catalog",
    items: [
      { title: "Categories", url: "/admin/categories", icon: Tags },
      { title: "Medicines", url: "/admin/medicines", icon: Pill },
      { title: "Lab Tests", url: "/admin/lab-tests", icon: ClipboardList },
    ]
  },
  {
    label: "People",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Doctors", url: "/admin/doctors", icon: Stethoscope },
    ]
  },
  {
    label: "Partners",
    items: [
      { title: "Stores", url: "/admin/stores", icon: Store },
      { title: "Labs", url: "/admin/labs", icon: TestTube },
      { title: "Partner Applications", url: "/admin/partner-applications", icon: FileText },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Lab Assignments", url: "/admin/lab-assignments", icon: ClipboardList },
      { title: "Delivery Assignments", url: "/admin/delivery-assignments", icon: MapPin },
      { title: "Tracking", url: "/admin/tracking", icon: MapPin },
    ]
  },
  {
    label: "Locations",
    items: [
      { title: "Geofencing", url: "/admin/geofencing", icon: Map },
      { title: "Locations", url: "/admin/locations", icon: Building2 },
    ]
  },
  {
    label: "Finance",
    items: [
      { title: "Payment Reconciliation", url: "/admin/reports/reconciliation", icon: DollarSign },
    ]
  },
  {
    label: "Development",
    items: [
      { title: "Schema Export", url: "/admin/schema-export", icon: Database },
      { title: "Code Export", url: "/admin/code-export", icon: Download },
    ]
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    // Auto-open the group that contains the current active route
    const activeGroup = adminSidebarGroups.find(group => 
      group.items.some(item => currentPath === item.url)
    );
    return activeGroup ? [activeGroup.label] : ["Overview"];
  });

  const isActive = (path: string) => currentPath === path;
  
  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  return (
    <Sidebar className="top-14">
      <SidebarContent>
        <SidebarMenu>
          {adminSidebarGroups.map((group) => (
            <Collapsible
              key={group.label}
              open={openGroups.includes(group.label)}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between">
                    <span className="font-medium">{group.label}</span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={({ isActive }) => 
                              isActive ? "bg-muted text-primary font-medium flex items-center" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center"
                            }
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
