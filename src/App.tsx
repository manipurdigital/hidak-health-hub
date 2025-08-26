
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ServiceabilityProvider } from '@/contexts/ServiceabilityContext';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { CartProvider } from '@/contexts/CartContext';
import { ConsentManager } from '@/components/consent/ConsentManager';
import { AccessibilityWrapper } from '@/components/AccessibilityWrapper';
import { SkipLink } from '@/components/SkipLink';

// Layout components
import { AdminLayout } from '@/components/AdminLayout';
import { CenterLayout } from '@/components/CenterLayout';

// Guard components
import { AdminGuard } from '@/components/auth/AdminGuard';
import { CenterGuard } from '@/components/CenterGuard';

// Pages that actually exist
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import LabTestsPage from '@/pages/LabTestsPage';
import { LabTestDetailPage } from '@/pages/LabTestDetailPage';
import MedicinesPage from '@/pages/MedicinesPage';
import { MedicineDetailPage } from '@/pages/MedicineDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';

// Center pages
import { CenterDashboardPage } from '@/pages/center/CenterDashboardPage';
import { CenterJobsPage } from '@/pages/center/CenterJobsPage';
import { CenterPaymentsPage } from '@/pages/center/CenterPaymentsPage';
import CenterJobTrackingPage from '@/pages/center/CenterJobTrackingPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminLabTestsPage from '@/pages/admin/AdminLabTestsPage';
import AdminLabAssignmentsPage from '@/pages/admin/AdminLabAssignmentsPage';
import { AdminLabPayoutsPage } from '@/pages/admin/AdminLabPayoutsPage';
import AdminMedicinesPage from '@/pages/admin/AdminMedicinesPage';
import AdminDoctorsPage from '@/pages/admin/AdminDoctorsPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminDeliveryPage from '@/pages/admin/AdminDeliveryPage';
import DashboardPage from '@/pages/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ServiceabilityProvider>
          <GoogleMapsProvider>
            <SubscriptionProvider>
              <CartProvider>
                <BrowserRouter>
                  <div className="min-h-screen bg-background font-sans antialiased">
                    <ConsentManager />
                    <AccessibilityWrapper>
                      <SkipLink />
                      <Toaster />
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/lab-tests" element={<LabTestsPage />} />
                        <Route path="/lab-tests/:id" element={<LabTestDetailPage />} />
                        <Route path="/medicines" element={<MedicinesPage />} />
                        <Route path="/medicines/:id" element={<MedicineDetailPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />

                        {/* Center Routes */}
                        <Route path="/center" element={<CenterGuard><CenterLayout /></CenterGuard>}>
                          <Route index element={<CenterDashboardPage />} />
                          <Route path="jobs" element={<CenterJobsPage />} />
                          <Route path="payments" element={<CenterPaymentsPage />} />
                          <Route path="tracking/lab/:id" element={<CenterJobTrackingPage />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                          <Route index element={<AdminDashboardPage />} />
                          <Route path="medicines" element={<AdminMedicinesPage />} />
                          <Route path="lab-tests" element={<AdminLabTestsPage />} />
                          <Route path="lab-assignments" element={<AdminLabAssignmentsPage />} />
                          <Route path="lab-payouts" element={<AdminLabPayoutsPage />} />
                          <Route path="doctors" element={<AdminDoctorsPage />} />
                          <Route path="categories" element={<AdminCategoriesPage />} />
                          <Route path="reports" element={<AdminReportsPage />} />
                          <Route path="delivery" element={<AdminDeliveryPage />} />
                        </Route>

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AccessibilityWrapper>
                  </div>
                </BrowserRouter>
              </CartProvider>
            </SubscriptionProvider>
          </GoogleMapsProvider>
        </ServiceabilityProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
