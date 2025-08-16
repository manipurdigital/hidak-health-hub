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
              <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
              <Route path="/auth" element={<GuestRoute><AuthPage /></GuestRoute>} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
              <Route path="/checkout" element={<AuthGuard><CheckoutPage /></AuthGuard>} />
              <Route path="/reports" element={<AuthGuard><ReportsPage /></AuthGuard>} />
              <Route path="/consultation/:consultationId" element={<AuthGuard><ConsultationChatPage /></AuthGuard>} />
              <Route path="/prescriptions" element={<AuthGuard><PrescriptionsPage /></AuthGuard>} />
              <Route path="/care-plus" element={<AuthGuard><CareSubscriptionPage /></AuthGuard>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminDashboardPage /></AuthGuard>} />
              <Route path="/admin/medicines" element={<AuthGuard requiredRole="admin"><AdminMedicinesPage /></AuthGuard>} />
              <Route path="/admin/lab-tests" element={<AuthGuard requiredRole="admin"><AdminLabTestsPage /></AuthGuard>} />
              <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsersPage /></AuthGuard>} />
              <Route path="/admin/doctors" element={<AuthGuard requiredRole="admin"><AdminDoctorsPage /></AuthGuard>} />
              
              {/* Lab Routes */}
              <Route path="/lab" element={<AuthGuard requiredRole="lab"><LabDashboardPage /></AuthGuard>} />
              
              {/* Doctor Routes */}
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
