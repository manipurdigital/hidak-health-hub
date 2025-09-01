import { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  Users,
  Beaker,
  MapPin,
  DollarSign,
  Pill,
  Stethoscope,
  Store,
  Truck,
  BarChart3,
  FileText,
  Shield,
  Database,
  Code,
  Route,
  CreditCard,
  UserPlus,
  FolderOpen,
  Activity,
  ChevronDown,
  Package
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function AdminSidebar() {
  const [openSections, setOpenSections] = useState({
    contentManagement: false,
    labManagement: false,
    deliveryLogistics: false,
    analyticsReports: false,
    financial: false,
    system: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Portal</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/orders">
                  <Package className="mr-2 h-4 w-4" />
                  Orders
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <Collapsible open={openSections.contentManagement} onOpenChange={() => toggleSection('contentManagement')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                Content Management
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.contentManagement ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/medicines">
                      <Pill className="mr-2 h-4 w-4" />
                      Medicines
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/categories">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Categories
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/doctors">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Doctors
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openSections.labManagement} onOpenChange={() => toggleSection('labManagement')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                Lab Management
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.labManagement ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/lab-tests">
                      <Beaker className="mr-2 h-4 w-4" />
                      Lab Tests
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/labs">
                      <Activity className="mr-2 h-4 w-4" />
                      Lab Centers
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/lab-assignments">
                      <MapPin className="mr-2 h-4 w-4" />
                      Assignments
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/lab-payouts">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Payouts
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openSections.deliveryLogistics} onOpenChange={() => toggleSection('deliveryLogistics')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                Delivery & Logistics
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.deliveryLogistics ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/delivery">
                      <Truck className="mr-2 h-4 w-4" />
                      Delivery
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/delivery-assignments">
                      <Route className="mr-2 h-4 w-4" />
                      Assignments
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/tracking">
                      <Activity className="mr-2 h-4 w-4" />
                      Tracking
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/geofencing">
                      <MapPin className="mr-2 h-4 w-4" />
                      Geofencing
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/locations">
                      <MapPin className="mr-2 h-4 w-4" />
                      Locations
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/base-locations">
                      <MapPin className="mr-2 h-4 w-4" />
                      Base Locations
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openSections.analyticsReports} onOpenChange={() => toggleSection('analyticsReports')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                Analytics & Reports
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.analyticsReports ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/analytics">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/reports">
                      <FileText className="mr-2 h-4 w-4" />
                      Reports
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/performance">
                      <Activity className="mr-2 h-4 w-4" />
                      Performance
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                Financial
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.financial ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/payment-reconciliation">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment Reconciliation
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/partner-applications">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Partner Applications
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible open={openSections.system} onOpenChange={() => toggleSection('system')}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-between">
                System
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openSections.system ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/security">
                      <Shield className="mr-2 h-4 w-4" />
                      Security
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/backup-restore">
                      <Database className="mr-2 h-4 w-4" />
                      Backup & Restore
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/schema-export">
                      <Database className="mr-2 h-4 w-4" />
                      Schema Export
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/admin/code-export">
                      <Code className="mr-2 h-4 w-4" />
                      Code Export
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
