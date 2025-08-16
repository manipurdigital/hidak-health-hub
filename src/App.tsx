import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
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
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/consultation/:consultationId" element={<ConsultationChatPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/care-plus" element={<CareSubscriptionPage />} />
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
