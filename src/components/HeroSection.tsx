import { Button } from "@/components/ui/button";
import { Shield, Truck, Clock, Users, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/healthcare-hero.jpg";

const HeroSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOrderMedicines = () => {
    navigate('/medicines');
    toast({
      title: "Order Medicines",
      description: "Browse our complete medicine catalog",
    });
  };

  const handleBookLabTest = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    toast({
      title: "Lab Tests",
      description: "Explore our comprehensive lab testing services",
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
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 text-lg px-8 py-3 hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Order via WhatsApp
            </Button>
          </a>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Health,
                <br />
                <span className="text-primary">Our Priority</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Complete healthcare at your fingertips. Order medicines, book lab tests, 
                consult doctors online, and access wellness services - all in one place.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg hover:scale-105 transition-transform duration-200"
                onClick={handleOrderMedicines}
              >
                Order Medicines
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg border-primary text-primary hover:bg-primary hover:text-white hover:scale-105 transition-all duration-200"
                onClick={handleBookLabTest}
              >
                Book Lab Test
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">100% Authentic</div>
                  <div className="text-xs text-muted-foreground">Verified medicines</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Truck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Free Delivery</div>
                  <div className="text-xs text-muted-foreground">On orders ₹499+</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Clock className="w-6 h-6 text-medical-teal" />
                </div>
                <div>
                  <div className="font-semibold text-sm">24/7 Support</div>
                  <div className="text-xs text-muted-foreground">Always available</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-trust-badge rounded-lg">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-sm">50L+ Users</div>
                  <div className="text-xs text-muted-foreground">Trust us</div>
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