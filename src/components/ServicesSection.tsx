import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, TestTube2, Video, Heart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import pharmacyImage from "@/assets/pharmacy-section.jpg";
import consultationImage from "@/assets/consultation-section.jpg";
import labImage from "@/assets/lab-section.jpg";
import { isFeatureEnabled } from "@/lib/feature-flags";

const ServicesSection = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const handleServiceClick = (serviceTitle: string) => {
    switch (serviceTitle) {
      case "Online Pharmacy":
        navigate("/medicines");
        break;
      case "Doctor Consultations":
        navigate("/doctors");
        break;
      case "Lab Tests":
        navigate("/lab-tests");
        break;
      case "Wellness Plans":
        navigate("/wellness");
        break;
      default:
        break;
    }
  };

  const allServices = [
    {
      icon: <Pill className="w-8 h-8" />,
      title: "Online Pharmacy",
      description: "Order medicines with prescription upload. 100% authentic products with nationwide delivery.",
      image: pharmacyImage,
      features: ["Prescription upload", "Same-day delivery", "Auto-refills", "Generic alternatives"],
      buttonText: "Order Now",
      buttonVariant: "medical" as const,
      stats: "50,000+ medicines available"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Doctor Consultations",
      description: "Consult certified doctors online via text, audio, or video calls. Available 24/7.",
      image: consultationImage,
      features: ["Video consultations", "24/7 availability", "Specialist doctors", "Digital prescriptions"],
      buttonText: "Consult Now",
      buttonVariant: "default" as const,
      stats: "1000+ doctors online"
    },
    {
      icon: <TestTube2 className="w-8 h-8" />,
      title: "Lab Tests",
      description: "Book 2000+ lab tests with home sample collection. Get digital reports instantly.",
      image: labImage,
      features: ["Home collection", "Digital reports", "Preventive packages", "Expert interpretation"],
      buttonText: "Book Test",
      buttonVariant: "success" as const,
      stats: "2000+ tests available"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Wellness Plans",
      description: "Comprehensive wellness packages including Ayurveda, fitness, and preventive care.",
      image: null,
      features: ["Ayurveda consultation", "Fitness tracking", "Nutrition plans", "Mental wellness"],
      buttonText: "Explore Plans",
      buttonVariant: "outline" as const,
      stats: "Holistic wellness approach"
    }
  ];

  // Filter services based on feature flags
  const services = allServices.filter(service => {
    if (service.title === "Doctor Consultations") {
      return isFeatureEnabled("ENABLE_CONSULTATIONS");
    }
    if (service.title === "Wellness Plans") {
      return isFeatureEnabled("ENABLE_WELLNESS");
    }
    return true;
  });

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Complete Healthcare Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access all your healthcare needs through our comprehensive platform designed for modern lifestyle
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm"
            >
              {service.image && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 p-3 bg-white/90 rounded-xl">
                    <div className="text-primary">
                      {service.icon}
                    </div>
                  </div>
                </div>
              )}
              
              <CardHeader className={service.image ? "pb-4" : "pt-8"}>
                {!service.image && (
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                    {service.icon}
                  </div>
                )}
                <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features list */}
                <div className="grid grid-cols-2 gap-2">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-2 rounded-lg w-fit">
                  {service.stats}
                </div>

                {/* Action button */}
                <Button 
                  variant={service.buttonVariant} 
                  className="w-full group-hover:scale-105 transition-transform duration-200"
                  size="lg"
                  onClick={() => handleServiceClick(service.title)}
                >
                  {service.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary to-accent p-8 rounded-2xl text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Join millions of users who trust HAK SHEL for their healthcare needs. Experience the future of digital healthcare today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="bg-white text-primary border-white hover:bg-white/90 hover:scale-105 transition-all duration-200"
                onClick={() => navigate("/auth")}
              >
                Download App
              </Button>
              {/* Features link - Only visible to admins */}
              {userRole === 'admin' && (
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="text-white border-white/20 border hover:bg-white/10 hover:scale-105 transition-all duration-200"
                  onClick={() => navigate("/features")}
                >
                  Learn More
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;