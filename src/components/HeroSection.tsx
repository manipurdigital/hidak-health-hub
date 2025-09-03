import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Truck, Clock, Stethoscope, Upload, MapPin, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceability } from "@/contexts/ServiceabilityContext";
import heroImage from "@/assets/healthcare-hero.jpg";

const HeroSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, deliveryCoverage } = useServiceability();

  const inDeliveryArea = deliveryCoverage === 'has_partners' || deliveryCoverage === 'available_no_partner';

  const handleUploadPrescription = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to upload prescriptions",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    toast({
      title: "Upload Prescription",
      description: "Opening prescription upload...",
    });
  };

  const handleOrderMedicines = () => {
    navigate('/medicines');
    toast({
      title: "Order Medicines",
      description: "Browse our complete medicine catalog",
    });
  };

  const handleBookLabTest = () => {
    navigate('/lab-tests');
    toast({
      title: "Lab Tests",
      description: "Book lab tests with home sample collection",
    });
  };

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* WhatsApp Button */}
        <div className="flex justify-center mb-8">
          <a 
            href="https://wa.me/918794265302?text=Welcome%20to%20Hak%20Shel.%20Kindly%20upload%20your%20prescription%20to%20proceed%20with%20order%20confirmation."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button 
              size="lg" 
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 text-lg px-8 py-3 hover:scale-105 transition-all duration-200 shadow-lg animate-pulse"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Order via WhatsApp
            </Button>
          </a>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            {/* Location Badge */}
            {location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </span>
                {inDeliveryArea && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-300">
                    Delivery Available
                  </Badge>
                )}
              </div>
            )}
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Health,
                <br />
                <span className="text-primary">Delivered</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Order medicines, book lab tests, and consult doctors online. 
                Complete healthcare solutions at your fingertips.
              </p>
            </div>
            
            {/* Primary CTA - Upload Prescription */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 font-semibold text-lg px-8 py-6"
                onClick={handleUploadPrescription}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Prescription & Order
              </Button>
              
              {/* Secondary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-200 font-medium px-6 py-3"
                  onClick={handleOrderMedicines}
                >
                  Browse Medicines
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all duration-200 font-medium px-6 py-3"
                  onClick={handleBookLabTest}
                >
                  Book Lab Test
                </Button>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Licensed Pharmacy</div>
                  <div className="text-xs text-muted-foreground">Verified & regulated</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Truck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Quick Delivery</div>
                  <div className="text-xs text-muted-foreground">Same day delivery</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Stethoscope className="w-6 h-6 text-medical-teal" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Expert Doctors</div>
                  <div className="text-xs text-muted-foreground">Online consultations</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-sm">24/7 Care</div>
                  <div className="text-xs text-muted-foreground">Round-the-clock support</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right image */}
          <div className="relative animate-slide-up">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Digital Healthcare Platform" 
                className="w-full h-auto rounded-2xl shadow-2xl animate-float"
              />
              
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg border">
                <div className="text-sm font-semibold text-success">✅ Order Confirmed</div>
                <div className="text-xs text-muted-foreground">Delivery in 30 mins</div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border">
                <div className="text-sm font-semibold text-primary">💊 Medicine Reminder</div>
                <div className="text-xs text-muted-foreground">Take your vitamin D</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;