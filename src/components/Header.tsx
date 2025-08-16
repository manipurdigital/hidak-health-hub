import { Button } from "@/components/ui/button";
import { User, ShoppingCart, Phone, FileText, Pill, Crown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Searching...",
        description: `Looking for "${searchQuery}"`,
      });
      // Simulate search
      setTimeout(() => {
        toast({
          title: "Search Complete",
          description: `Found ${Math.floor(Math.random() * 50) + 10} results for "${searchQuery}"`,
        });
      }, 1000);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEmergency = () => {
    toast({
      title: "Emergency Service",
      description: "Connecting you to emergency healthcare services...",
      variant: "destructive",
    });
  };

  const handleLogin = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleCart = () => {
    if (itemCount > 0) {
      navigate("/checkout");
    } else {
      toast({
        title: "Cart Empty",
        description: "Add some medicines to your cart first",
      });
    }
  };

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-2 text-sm text-muted-foreground border-b border-border">
          <div className="flex items-center gap-4">
            <span>📞 24/7 Support: 1800-000-0000</span>
            <span>🚚 Free delivery on orders above ₹499</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Download App</span>
            <span>Store Locator</span>
          </div>
        </div>
        
        {/* Main header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">
              HAK SHEL
              <span className="text-accent">+</span>
            </h1>
          </div>
          
          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <SearchBar 
              placeholder="Search for medicines, health products, lab tests..."
              className="w-full"
            />
          </div>
          
          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleEmergency}
            >
              <Phone className="w-4 h-4" />
              Emergency
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors"
              onClick={() => navigate('/care-plus')}
            >
              <Crown className="w-4 h-4" />
              Care+
            </Button>
            <Button
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => navigate('/reports')}
            >
              <FileText className="w-4 h-4" />
              Reports
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={() => navigate('/prescriptions')}
            >
              <Pill className="w-4 h-4" />
              Prescriptions
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={handleLogin}
            >
              <User className="w-4 h-4" />
              {user ? "Dashboard" : "Login"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 relative hover:bg-accent/10 hover:text-accent transition-colors"
              onClick={handleCart}
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {itemCount}
              </span>
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <nav className="flex items-center gap-8">
            <Button 
              variant="ghost" 
              className="text-primary font-medium hover:bg-primary/10 transition-colors"
              onClick={() => scrollToSection('pharmacy')}
            >
              Medicines
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => scrollToSection('services')}
            >
              Lab Tests
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => scrollToSection('services')}
            >
              Consult Doctors
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => scrollToSection('services')}
            >
              Wellness
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => scrollToSection('services')}
            >
              Care Plan
            </Button>
          </nav>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">📍</span>
            <span className="text-sm">Select Location</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;