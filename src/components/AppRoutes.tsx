import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { FirstVisitFlowGate } from '@/components/FirstVisitFlowGate';
import { isFeatureEnabled } from '@/lib/feature-flags';

// Import all the pages and components
import AuthPage from '@/pages/AuthPage';
import Index from '@/pages/Index';
import AccountPage from '@/pages/AccountPage';
import MedicinesPage from '@/pages/MedicinesPage';
import { MedicineDetailPage } from '@/pages/MedicineDetailPage';
import LabTestsPage from '@/pages/LabTestsPage';
import { LabTestDetailPage } from '@/pages/LabTestDetailPage';
import ReportsPage from '@/pages/ReportsPage';
import PrescriptionsPage from '@/pages/PrescriptionsPage';
import DoctorsPage from '@/pages/DoctorsPage';
import DoctorProfilePage from '@/pages/DoctorProfilePage';
import WellnessPage from '@/pages/WellnessPage';
import CheckoutPage from '@/pages/CheckoutPage';
import { OrderSuccessPage } from '@/pages/OrderSuccessPage';
import { LabBookingSuccessPage } from '@/pages/LabBookingSuccessPage';
import NotFound from '@/pages/NotFound';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { DoctorGuard } from '@/components/auth/DoctorGuard';
import { AdminLayoutWrapper } from '@/components/AdminLayoutWrapper';
import { DoctorPendingPage } from '@/pages/doctor/DoctorPendingPage';
import { DoctorLayout } from '@/components/DoctorLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import { ConsultationSuccessPage } from '@/pages/ConsultationSuccessPage';
import { ConsultationRoomPage } from '@/pages/ConsultationRoomPage';
import ConsultationChatPage from '@/pages/ConsultationChatPage';
import DashboardPage from '@/pages/DashboardPage';
import DoctorDashboardPage from '@/pages/doctor/DoctorDashboardPage';
import { LabDashboardPage } from '@/pages/lab/LabDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminMedicinesPage from '@/pages/admin/AdminMedicinesPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminDoctorsPage from '@/pages/admin/AdminDoctorsPage';
import AdminStoresPage from '@/pages/admin/AdminStoresPage';
import AdminLabTestsPage from '@/pages/admin/AdminLabTestsPage';
import Labs from '@/pages/admin/Labs';
import AdminLabAssignmentsPage from '@/pages/admin/AdminLabAssignmentsPage';
import AdminLabPayoutsPage from '@/pages/admin/AdminLabPayoutsPage';
import AdminDeliveryPage from '@/pages/admin/AdminDeliveryPage';
import AdminDeliveryAssignmentsPage from '@/pages/admin/AdminDeliveryAssignmentsPage';
import AdminTrackingPage from '@/pages/admin/AdminTrackingPage';
import AdminGeofencingPage from '@/pages/admin/AdminGeofencingPage';
import AdminLocationsPage from '@/pages/admin/AdminLocationsPage';
import { AdminAnalyticsDashboard } from '@/pages/admin/AdminAnalyticsDashboard';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminPerformancePage from '@/pages/admin/AdminPerformancePage';
import AdminPaymentReconciliationPage from '@/pages/admin/AdminPaymentReconciliationPage';
import AdminPartnerApplicationsPage from '@/pages/admin/AdminPartnerApplicationsPage';
import AdminSecurityPage from '@/pages/admin/AdminSecurityPage';
import AdminBackupRestorePage from '@/pages/admin/AdminBackupRestorePage';
import AdminSchemaExportPage from '@/pages/admin/AdminSchemaExportPage';
import AdminCodeExportPage from '@/pages/admin/AdminCodeExportPage';
import AdminImportsPage from '@/pages/admin/AdminImportsPage';
import { CenterAccountLinking } from '@/components/admin/CenterAccountLinking';
import AdminBaseLocationsPage from '@/pages/admin/AdminBaseLocationsPage';
import { AdminMedicineRequestsPage } from '@/pages/admin/AdminMedicineRequestsPage';
import DoctorAvailabilityPage from '@/pages/doctor/DoctorAvailabilityPage';
import { CenterGuard } from '@/components/CenterGuard';
import { CenterLayout } from '@/components/CenterLayout';
import { CenterJobsPage } from '@/pages/center/CenterJobsPage';
import { CenterPaymentsPage } from '@/pages/center/CenterPaymentsPage';
import CenterJobTrackingPage from '@/pages/center/CenterJobTrackingPage';

export function AppRoutes() {
  const location = useLocation();
  const isFirstVisitFlowEnabled = isFeatureEnabled('ENABLE_FIRST_VISIT_FLOW');
  
  // Skip first visit flow for admin, auth, and center routes
  const skipFirstVisitFlow = location.pathname.startsWith('/admin') || 
                              location.pathname.startsWith('/auth') ||
                              location.pathname.startsWith('/center') ||
                              location.pathname.startsWith('/doctor') ||
                              location.pathname.startsWith('/lab');

  const routes = (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Index />} />
      <Route path="/profile" element={<AccountPage />} />
      
      {/* Public Routes */}
      <Route path="/medicines" element={<MedicinesPage />} />
      <Route path="/medicines/:id" element={<MedicineDetailPage />} />
      <Route path="/medicine/:id" element={<MedicineDetailPage />} />
      <Route path="/lab-tests" element={<LabTestsPage />} />
      <Route path="/lab-tests/:id" element={<LabTestDetailPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/prescriptions" element={<PrescriptionsPage />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/doctors/:id" element={<DoctorProfilePage />} />
      <Route path="/wellness" element={<WellnessPage />} />
      
      {/* Consultation Routes */}
      <Route path="/consult-success/:consultId" element={
        <AuthGuard>
          <ConsultationSuccessPage />
        </AuthGuard>
      } />
      <Route path="/consult/:consultId" element={
        <AuthGuard>
          <ConsultationRoomPage />
        </AuthGuard>
      } />
      <Route path="/consultation/:consultationId" element={
        <AuthGuard>
          <ConsultationRoomPage />
        </AuthGuard>
      } />
      <Route path="/consultation/:consultationId/chat" element={
        <AuthGuard>
          <ConsultationChatPage />
        </AuthGuard>
      } />
      <Route path="/dashboard" element={
        <AuthGuard>
          <DashboardPage />
        </AuthGuard>
      } />
      
      {/* Doctor Routes */}
      <Route path="/doctor" element={
        <DoctorGuard>
          <DoctorDashboardPage />
        </DoctorGuard>
      } />
      <Route path="/doctor/availability" element={
        <DoctorGuard>
          <DoctorAvailabilityPage />
        </DoctorGuard>
      } />
      
      {/* Lab Routes */}
      <Route path="/lab" element={
        <AuthGuard requiredRole="lab">
          <LabDashboardPage />
        </AuthGuard>
      } />

      <Route path="/checkout" element={
        <AuthGuard>
          <CheckoutPage />
        </AuthGuard>
      } />
      <Route path="/order-success/:orderId" element={
        <AuthGuard>
          <OrderSuccessPage />
        </AuthGuard>
      } />
      <Route path="/order/success/:orderId" element={
        <AuthGuard>
          <OrderSuccessPage />
        </AuthGuard>
      } />
      <Route path="/lab-booking/success/:bookingId" element={
        <AuthGuard>
          <LabBookingSuccessPage />
        </AuthGuard>
      } />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminDashboardPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminDashboardPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
       />
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminUsersPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/medicines"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminMedicinesPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/medicine-requests"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminMedicineRequestsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminOrdersPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminCategoriesPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminDoctorsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/stores"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminStoresPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/lab-tests"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminLabTestsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/labs"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <Labs />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/lab-assignments"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminLabAssignmentsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/lab-payouts"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminLabPayoutsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/delivery"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminDeliveryPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/delivery-assignments"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminDeliveryAssignmentsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/tracking"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminTrackingPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/geofencing"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminGeofencingPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminLocationsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route 
        path="/admin/base-locations" 
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminBaseLocationsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        } 
      />
      <Route
        path="/admin/analytics"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminAnalyticsDashboard />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminReportsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/performance"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminPerformancePage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/payment-reconciliation"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminPaymentReconciliationPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/partner-applications"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminPartnerApplicationsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/security"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminSecurityPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/backup-restore"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminBackupRestorePage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/schema-export"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminSchemaExportPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/code-export"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminCodeExportPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      <Route
        path="/admin/imports"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <AdminImportsPage />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />
      
      {/* CenterAccountLinking Route */}
      <Route
        path="/admin/center-link"
        element={
          <AdminGuard>
            <AdminLayoutWrapper>
              <CenterAccountLinking />
            </AdminLayoutWrapper>
          </AdminGuard>
        }
      />

      {/* Center Routes */}
      <Route path="/center" element={
        <CenterGuard>
          <CenterLayout />
        </CenterGuard>
      }>
        <Route index element={<CenterJobsPage />} />
        <Route path="jobs" element={<CenterJobsPage />} />
        <Route path="payments" element={<CenterPaymentsPage />} />
        <Route path="tracking/:type/:id" element={<CenterJobTrackingPage />} />
      </Route>
      
      {/* Catch all route - must be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  // Apply FirstVisitFlowGate only to non-admin routes when feature is enabled
  if (isFirstVisitFlowEnabled && !skipFirstVisitFlow) {
    return <FirstVisitFlowGate>{routes}</FirstVisitFlowGate>;
  }

  return routes;
}