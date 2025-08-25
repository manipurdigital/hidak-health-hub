import { useState } from "react";
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

const Index = () => {
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const handleLocationConfirmed = () => {
    setIsLocationConfirmed(true);
  };

  // Always show location gate on homepage visit
  if (!isLocationConfirmed) {
    return <HomeLocationGate onLocationConfirmed={handleLocationConfirmed} />;
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

export default Index;
