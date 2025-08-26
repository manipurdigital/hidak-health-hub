import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Auth } from '@/pages/Auth';
import { Home } from '@/pages/Home';
import { Profile } from '@/pages/Profile';
import { AdminGuard } from '@/guards/AdminGuard';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage';
import { AdminStoresPage } from '@/pages/admin/AdminStoresPage';
import { AdminLabTestsPage } from '@/pages/admin/AdminLabTestsPage';
import { AdminLabsPage } from '@/pages/admin/AdminLabsPage';
import { AdminLabAssignmentsPage } from '@/pages/admin/AdminLabAssignmentsPage';
import { AdminLabPayoutsPage } from '@/pages/admin/AdminLabPayoutsPage';
import { AdminDeliveryPage } from '@/pages/admin/AdminDeliveryPage';
import { AdminDeliveryAssignmentsPage } from '@/pages/admin/AdminDeliveryAssignmentsPage';
import { AdminTrackingPage } from '@/pages/admin/AdminTrackingPage';
import { AdminGeofencingPage } from '@/pages/admin/AdminGeofencingPage';
import { AdminLocationsPage } from '@/pages/admin/AdminLocationsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminPerformancePage } from '@/pages/admin/AdminPerformancePage';
import { AdminPaymentReconciliationPage } from '@/pages/admin/AdminPaymentReconciliationPage';
import { AdminPartnerApplicationsPage } from '@/pages/admin/AdminPartnerApplicationsPage';
import { AdminSecurityPage } from '@/pages/admin/AdminSecurityPage';
import { AdminBackupRestorePage } from '@/pages/admin/AdminBackupRestorePage';
import { AdminSchemaExportPage } from '@/pages/admin/AdminSchemaExportPage';
import { AdminCodeExportPage } from '@/pages/admin/AdminCodeExportPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { ServiceabilityContextProvider } from '@/contexts/ServiceabilityContext';
import { CartProvider } from '@/contexts/CartContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import AdminBaseLocationsPage from './pages/admin/AdminBaseLocationsPage';

function App() {
  return (
    <Router>
      <GoogleMapsProvider>
        <ServiceabilityContextProvider>
          <CartProvider>
            <SubscriptionProvider>
              <div className="min-h-screen bg-background">
                <Toaster />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminDashboardPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminUsersPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/medicines"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminMedicinesPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminCategoriesPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/doctors"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminDoctorsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/stores"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminStoresPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/lab-tests"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminLabTestsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/labs"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminLabsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/lab-assignments"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminLabAssignmentsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/lab-payouts"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminLabPayoutsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/delivery"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminDeliveryPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/delivery-assignments"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminDeliveryAssignmentsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/tracking"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminTrackingPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/geofencing"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminGeofencingPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/locations"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminLocationsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route 
                    path="/admin/base-locations" 
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminBaseLocationsPage />
                        </AdminLayout>
                      </AdminGuard>
                    } 
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminAnalyticsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/reports"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminReportsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/performance"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminPerformancePage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/payment-reconciliation"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminPaymentReconciliationPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/partner-applications"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminPartnerApplicationsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/security"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminSecurityPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/backup-restore"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminBackupRestorePage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/schema-export"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminSchemaExportPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/code-export"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminCodeExportPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <AdminGuard>
                        <AdminLayout>
                          <AdminSettingsPage />
                        </AdminLayout>
                      </AdminGuard>
                    }
                  />
                </Routes>
              </div>
            </SubscriptionProvider>
          </CartProvider>
        </ServiceabilityContextProvider>
      </GoogleMapsProvider>
    </Router>
  );
}

export default App;
