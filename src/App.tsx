import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { ServiceabilityProvider } from '@/contexts/ServiceabilityContext';
import { CartProvider } from '@/contexts/CartContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CallProvider } from '@/components/CallProvider';
import { AppRoutes } from '@/components/AppRoutes';

// Create a single QueryClient instance for the whole app (avoid recreating on re-renders)
const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GoogleMapsProvider>
            <ServiceabilityProvider>
              <CartProvider>
                <SubscriptionProvider>
                  <CallProvider>
                    <div className="min-h-screen bg-background">
                      <Toaster />
                      <AppRoutes />
                    </div>
                  </CallProvider>
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