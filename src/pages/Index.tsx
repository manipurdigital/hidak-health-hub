import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import PharmacySection from "@/components/PharmacySection";
import DiagnosticsSection from "@/components/DiagnosticsSection";
import ConsultationsSection from "@/components/ConsultationsSection";
import { TrendingMedicinesCarousel } from "@/components/TrendingMedicinesCarousel";
import Footer from "@/components/Footer";
import { FeatureGuard } from "@/components/FeatureGuard";
import { useServiceability } from "@/contexts/ServiceabilityContext";
import { useEffect } from "react";

const Index = () => {
  const { autoDetect, location } = useServiceability();

  useEffect(() => {
    // Auto-detect location on first visit if not cached
    if (!location) {
      autoDetect();
    }
  }, [location, autoDetect]);

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

export default Index;
