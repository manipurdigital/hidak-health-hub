import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { LocationBanner } from "@/components/home/LocationBanner";
import { HomeQuickActions } from "@/components/home/HomeQuickActions";
import { PopularCategoriesStrip } from "@/components/home/PopularCategoriesStrip";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TestimonialsStrip } from "@/components/home/TestimonialsStrip";
import { MobileQuickNav } from "@/components/home/MobileQuickNav";
import { TrendingMedicinesCarousel } from "@/components/TrendingMedicinesCarousel";
import Footer from "@/components/Footer";
import { FeatureGuard } from "@/components/FeatureGuard";
import { HomeLocationGate } from "@/components/HomeLocationGate";

// Lazy load heavy sections for better performance
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const PharmacySection = lazy(() => import("@/components/PharmacySection"));
const DiagnosticsSection = lazy(() => import("@/components/DiagnosticsSection"));
const ConsultationsSection = lazy(() => import("@/components/ConsultationsSection"));

const HomePage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect admins to their dashboard
  useEffect(() => {
    if (!loading && user && (userRole === 'admin' || userRole === 'analyst')) {
      navigate('/admin', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Don't render the homepage if we're redirecting an admin
  if (!loading && user && (userRole === 'admin' || userRole === 'analyst')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LocationBanner onLocationClick={() => {
        // This would open location picker modal
        console.log("Location picker clicked");
      }} />
      <main>
        <HeroSection />
        <HomeQuickActions />
        <PopularCategoriesStrip />
        <HowItWorks />
        
        <FeatureGuard feature="SHOW_TRENDING_MEDICINES">
          <div className="container mx-auto px-4 py-8">
            <TrendingMedicinesCarousel />
          </div>
        </FeatureGuard>
        
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
          <ServicesSection />
        </Suspense>
        
        <TestimonialsStrip />
        
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
          <PharmacySection />
        </Suspense>
        
        <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
          <DiagnosticsSection />
        </Suspense>
        
        <FeatureGuard feature="ENABLE_CONSULTATIONS">
          <Suspense fallback={<div className="py-20 text-center">Loading...</div>}>
            <ConsultationsSection />
          </Suspense>
        </FeatureGuard>
      </main>
      <Footer />
      <MobileQuickNav />
    </div>
  );
};

const Index = () => {
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const handleLocationConfirmed = () => {
    setIsLocationConfirmed(true);
  };

  // Show location gate only if feature is enabled, otherwise show normal homepage
  return (
    <FeatureGuard feature="ENABLE_LOCATION_GATE" fallback={<HomePage />}>
      {!isLocationConfirmed ? (
        <HomeLocationGate onLocationConfirmed={handleLocationConfirmed} />
      ) : (
        <HomePage />
      )}
    </FeatureGuard>
  );
};

export default Index;
