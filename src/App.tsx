import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthGuard, PublicRoute, GuestRoute } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import MedicinesPage from "./pages/MedicinesPage";
import LabTestsPage from "./pages/LabTestsPage";
import DoctorsPage from "./pages/DoctorsPage";
import WellnessPage from "./pages/WellnessPage";
import CarePlanPage from "./pages/CarePlanPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMedicinesPage from "./pages/admin/AdminMedicinesPage";
import AdminLabTestsPage from "./pages/admin/AdminLabTestsPage";
import AdminDoctorsPage from "./pages/admin/AdminDoctorsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { LabDashboardPage } from "./pages/lab/LabDashboardPage";
import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage";
import CheckoutPage from "./pages/CheckoutPage";
import ReportsPage from "./pages/ReportsPage";
import ConsultationChatPage from "./pages/ConsultationChatPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import CareSubscriptionPage from "./pages/CareSubscriptionPage";
import NotFound from "./pages/NotFound";
import { MedicineDetailPage } from "./pages/MedicineDetailPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { LabTestDetailPage } from "./pages/LabTestDetailPage";
import { LabBookingSuccessPage } from "./pages/LabBookingSuccessPage";
import { DoctorProfilePage } from "./pages/DoctorProfilePage";
import { ConsultationSuccessPage } from "./pages/ConsultationSuccessPage";
import { ConsultationRoomPage } from "./pages/ConsultationRoomPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes - No authentication required */}
              <Route path="/" element={<Index />} />
              <Route path="/medicines" element={<MedicinesPage />} />
              <Route path="/medicines/:id" element={<MedicineDetailPage />} />
              <Route path="/lab-tests" element={<LabTestsPage />} />
              <Route path="/lab-tests/:id" element={<LabTestDetailPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorProfilePage />} />
              <Route path="/wellness" element={<WellnessPage />} />
              <Route path="/care-plan" element={<CarePlanPage />} />
              
              {/* Guest Only Routes - Redirect authenticated users */}
              <Route path="/auth" element={<GuestRoute><AuthPage /></GuestRoute>} />
              
              {/* Protected Routes - Authentication required */}
              <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
              <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />
              <Route path="/reports" element={<AuthGuard><ReportsPage /></AuthGuard>} />
              <Route path="/prescriptions" element={<AuthGuard><PrescriptionsPage /></AuthGuard>} />
              <Route path="/care-plus" element={<AuthGuard><CareSubscriptionPage /></AuthGuard>} />
              
              {/* Consultation Routes - Authentication required */}
              <Route path="/consultation/:consultationId" element={<AuthGuard><ConsultationChatPage /></AuthGuard>} />
              <Route path="/consult/:consultId" element={<AuthGuard><ConsultationRoomPage /></AuthGuard>} />
              <Route path="/consult-success/:consultId" element={<AuthGuard><ConsultationSuccessPage /></AuthGuard>} />
              
              {/* Success Pages - Authentication required */}
              <Route path="/order-success/:orderId" element={<AuthGuard><OrderSuccessPage /></AuthGuard>} />
              <Route path="/lab-booking-success/:bookingId" element={<AuthGuard><LabBookingSuccessPage /></AuthGuard>} />
              
              {/* Admin Routes - Admin role required */}
              <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminDashboardPage /></AuthGuard>} />
              <Route path="/admin/medicines" element={<AuthGuard requiredRole="admin"><AdminMedicinesPage /></AuthGuard>} />
              <Route path="/admin/lab-tests" element={<AuthGuard requiredRole="admin"><AdminLabTestsPage /></AuthGuard>} />
              <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsersPage /></AuthGuard>} />
              <Route path="/admin/doctors" element={<AuthGuard requiredRole="admin"><AdminDoctorsPage /></AuthGuard>} />
              
              {/* Lab Routes - Lab role required */}
              <Route path="/lab" element={<AuthGuard requiredRole="lab"><LabDashboardPage /></AuthGuard>} />
              
              {/* Doctor Routes - Doctor role required */}
              <Route path="/doctor" element={<AuthGuard requiredRole="doctor"><DoctorDashboardPage /></AuthGuard>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </CartProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
