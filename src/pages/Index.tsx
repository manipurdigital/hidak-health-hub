import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import PharmacySection from "@/components/PharmacySection";
import DiagnosticsSection from "@/components/DiagnosticsSection";
import ConsultationsSection from "@/components/ConsultationsSection";
import { TrendingMedicinesCarousel } from "@/components/TrendingMedicinesCarousel";
import Footer from "@/components/Footer";
import { FeatureGuard } from "@/components/FeatureGuard";
import { HomeLocationGate } from "@/components/HomeLocationGate";

const HomePage = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect admins to their dashboard
  useEffect(() => {
    if (!loading && user && (userRole === 'admin' || userRole === 'analyst')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  // Don't render the homepage if we're redirecting an admin
  if (!loading && user && (userRole === 'admin' || userRole === 'analyst')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <div className="container mx-auto px-4 py-8">
          <TrendingMedicinesCarousel />
        </div>
        <ServicesSection />
        <PharmacySection />
        <DiagnosticsSection />
        <FeatureGuard feature="ENABLE_CONSULTATIONS">
          <ConsultationsSection />
        </FeatureGuard>
      </main>
      <Footer />
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
