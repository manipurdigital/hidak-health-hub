import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
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
import NotFound from '@/pages/NotFound';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { AdminLayoutWrapper } from '@/components/AdminLayoutWrapper';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import { ConsultationSuccessPage } from '@/pages/ConsultationSuccessPage';
import { ConsultationRoomPage } from '@/pages/ConsultationRoomPage';
import DashboardPage from '@/pages/DashboardPage';
import DoctorDashboardPage from '@/pages/doctor/DoctorDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
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
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { ServiceabilityProvider } from '@/contexts/ServiceabilityContext';
import { CartProvider } from '@/contexts/CartContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminBaseLocationsPage from './pages/admin/AdminBaseLocationsPage';

// Doctor components
import { DoctorGuard } from '@/components/auth/DoctorGuard';
import DoctorAvailabilityPage from '@/pages/doctor/DoctorAvailabilityPage';

function App() {
  const queryClient = new QueryClient();

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GoogleMapsProvider>
            <ServiceabilityProvider>
              <CartProvider>
                <SubscriptionProvider>
                  <div className="min-h-screen bg-background">
                    <Toaster />
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/profile" element={<AccountPage />} />
                  
                  {/* Public Routes */}
                  <Route path="/medicines" element={<MedicinesPage />} />
                  <Route path="/medicines/:id" element={<MedicineDetailPage />} />
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
                   
                   {/* Catch all route - must be last */}
                   <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
                  </SubscriptionProvider>
                </CartProvider>
              </ServiceabilityProvider>
            </GoogleMapsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </Router>
  );
}

export default App;
