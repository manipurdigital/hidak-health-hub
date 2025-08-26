import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ServiceabilityProvider } from '@/contexts/ServiceabilityContext';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { CartProvider } from '@/contexts/CartContext';
import { ConsentManager } from '@/components/ConsentManager';
import { AccessibilityWrapper } from '@/components/AccessibilityWrapper';
import { SkipLink } from '@/components/SkipLink';

// Layout components
import { MainLayout } from '@/components/MainLayout';
import { AdminLayout } from '@/components/AdminLayout';
import { CenterLayout } from '@/components/CenterLayout';

// Guard components
import { AdminGuard } from '@/components/AdminGuard';
import { CenterGuard } from '@/components/CenterGuard';

// Public pages
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { TermsPage } from '@/pages/TermsPage';
import { RefundPage } from '@/pages/RefundPage';
import { ShippingPage } from '@/pages/ShippingPage';
import { FaqPage } from '@/pages/FaqPage';
import { CareersPage } from '@/pages/CareersPage';
import { PressPage } from '@/pages/PressPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { InvestorsPage } from '@/pages/InvestorsPage';
import { BlogPage } from '@/pages/BlogPage';
import { BlogPostPage } from '@/pages/BlogPostPage';
import { SitemapPage } from '@/pages/SitemapPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Service pages
import { LabTestsPage } from '@/pages/LabTestsPage';
import { LabTestDetailPage } from '@/pages/LabTestDetailPage';
import { MedicinesPage } from '@/pages/MedicinesPage';
import { MedicineDetailPage } from '@/pages/MedicineDetailPage';
import { ConsultationPage } from '@/pages/ConsultationPage';
import { DoctorDetailPage } from '@/pages/DoctorDetailPage';
import { HealthPackagesPage } from '@/pages/HealthPackagesPage';
import { HealthPackageDetailPage } from '@/pages/HealthPackageDetailPage';

// User pages
import { ProfilePage } from '@/pages/ProfilePage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage';
import { PaymentFailurePage } from '@/pages/PaymentFailurePage';
import { SubscriptionPage } from '@/pages/SubscriptionPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { AddressesPage } from '@/pages/AddressesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { HealthRecordsPage } from '@/pages/HealthRecordsPage';
import { FamilyMembersPage } from '@/pages/FamilyMembersPage';
import { PrescriptionUploadPage } from '@/pages/PrescriptionUploadPage';

// Center pages
import { CenterDashboardPage } from '@/pages/center/CenterDashboardPage';
import { CenterJobsPage } from '@/pages/center/CenterJobsPage';
import { CenterPaymentsPage } from '@/pages/center/CenterPaymentsPage';
import { CenterJobTrackingPage } from '@/pages/center/CenterJobTrackingPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminMedicinesPage } from '@/pages/admin/AdminMedicinesPage';
import { AdminLabTestsPage } from '@/pages/admin/AdminLabTestsPage';
import AdminLabAssignmentsPage from '@/pages/admin/AdminLabAssignmentsPage';
import AdminLabPayoutsPage from '@/pages/admin/AdminLabPayoutsPage';
import { AdminDoctorsPage } from '@/pages/admin/AdminDoctorsPage';
import { AdminHealthPackagesPage } from '@/pages/admin/AdminHealthPackagesPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminCentersPage } from '@/pages/admin/AdminCentersPage';
import { AdminGeofencesPage } from '@/pages/admin/AdminGeofencesPage';
import { AdminDeliveryPage } from '@/pages/admin/AdminDeliveryPage';
import { AdminNotificationsPage } from '@/pages/admin/AdminNotificationsPage';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage';
import { AdminContentPage } from '@/pages/admin/AdminContentPage';
import { AdminPromotionsPage } from '@/pages/admin/AdminPromotionsPage';
import { AdminSubscriptionsPage } from '@/pages/admin/AdminSubscriptionsPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminSupportPage } from '@/pages/admin/AdminSupportPage';
import { AdminLogsPage } from '@/pages/admin/AdminLogsPage';
import { AdminBackupPage } from '@/pages/admin/AdminBackupPage';

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
                        <Route path="/" element={<MainLayout />}>
                          <Route index element={<HomePage />} />
                          <Route path="login" element={<LoginPage />} />
                          <Route path="signup" element={<SignupPage />} />
                          <Route path="about" element={<AboutPage />} />
                          <Route path="contact" element={<ContactPage />} />
                          <Route path="privacy" element={<PrivacyPage />} />
                          <Route path="terms" element={<TermsPage />} />
                          <Route path="refund" element={<RefundPage />} />
                          <Route path="shipping" element={<ShippingPage />} />
                          <Route path="faq" element={<FaqPage />} />
                          <Route path="careers" element={<CareersPage />} />
                          <Route path="press" element={<PressPage />} />
                          <Route path="partners" element={<PartnersPage />} />
                          <Route path="investors" element={<InvestorsPage />} />
                          <Route path="blog" element={<BlogPage />} />
                          <Route path="blog/:slug" element={<BlogPostPage />} />
                          <Route path="sitemap" element={<SitemapPage />} />
                          
                          {/* Service Routes */}
                          <Route path="lab-tests" element={<LabTestsPage />} />
                          <Route path="lab-tests/:id" element={<LabTestDetailPage />} />
                          <Route path="medicines" element={<MedicinesPage />} />
                          <Route path="medicines/:id" element={<MedicineDetailPage />} />
                          <Route path="consultation" element={<ConsultationPage />} />
                          <Route path="doctors/:id" element={<DoctorDetailPage />} />
                          <Route path="health-packages" element={<HealthPackagesPage />} />
                          <Route path="health-packages/:id" element={<HealthPackageDetailPage />} />
                          
                          {/* User Routes */}
                          <Route path="profile" element={<ProfilePage />} />
                          <Route path="orders" element={<OrdersPage />} />
                          <Route path="orders/:id" element={<OrderDetailPage />} />
                          <Route path="cart" element={<CartPage />} />
                          <Route path="checkout" element={<CheckoutPage />} />
                          <Route path="payment/success" element={<PaymentSuccessPage />} />
                          <Route path="payment/failure" element={<PaymentFailurePage />} />
                          <Route path="subscription" element={<SubscriptionPage />} />
                          <Route path="wishlist" element={<WishlistPage />} />
                          <Route path="addresses" element={<AddressesPage />} />
                          <Route path="notifications" element={<NotificationsPage />} />
                          <Route path="health-records" element={<HealthRecordsPage />} />
                          <Route path="family-members" element={<FamilyMembersPage />} />
                          <Route path="prescription-upload" element={<PrescriptionUploadPage />} />
                        </Route>

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
                          <Route path="users" element={<AdminUsersPage />} />
                          <Route path="orders" element={<AdminOrdersPage />} />
                          <Route path="medicines" element={<AdminMedicinesPage />} />
                          <Route path="lab-tests" element={<AdminLabTestsPage />} />
                          <Route path="lab-assignments" element={<AdminLabAssignmentsPage />} />
                          <Route path="lab-payouts" element={<AdminLabPayoutsPage />} />
                          <Route path="doctors" element={<AdminDoctorsPage />} />
                          <Route path="health-packages" element={<AdminHealthPackagesPage />} />
                          <Route path="categories" element={<AdminCategoriesPage />} />
                          <Route path="inventory" element={<AdminInventoryPage />} />
                          <Route path="reports" element={<AdminReportsPage />} />
                          <Route path="settings" element={<AdminSettingsPage />} />
                          <Route path="centers" element={<AdminCentersPage />} />
                          <Route path="geofences" element={<AdminGeofencesPage />} />
                          <Route path="delivery" element={<AdminDeliveryPage />} />
                          <Route path="notifications" element={<AdminNotificationsPage />} />
                          <Route path="analytics" element={<AdminAnalyticsPage />} />
                          <Route path="content" element={<AdminContentPage />} />
                          <Route path="promotions" element={<AdminPromotionsPage />} />
                          <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                          <Route path="payments" element={<AdminPaymentsPage />} />
                          <Route path="support" element={<AdminSupportPage />} />
                          <Route path="logs" element={<AdminLogsPage />} />
                          <Route path="backup" element={<AdminBackupPage />} />
                        </Route>

                        {/* 404 Route */}
                        <Route path="*" element={<NotFoundPage />} />
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
