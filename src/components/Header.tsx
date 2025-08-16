import { Button } from "@/components/ui/button";
import { Search, User, ShoppingCart, Phone } from "lucide-react";

const Header = () => {
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
              Hidak
              <span className="text-accent">+</span>
            </h1>
          </div>
          
          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search for medicines, health products, lab tests..."
                className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-muted/30"
              />
            </div>
          </div>
          
          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Emergency
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Login
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 relative">
              <ShoppingCart className="w-4 h-4" />
              Cart
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <nav className="flex items-center gap-8">
            <Button variant="ghost" className="text-primary font-medium">
              Medicines
            </Button>
            <Button variant="ghost" className="text-foreground">
              Lab Tests
            </Button>
            <Button variant="ghost" className="text-foreground">
              Consult Doctors
            </Button>
            <Button variant="ghost" className="text-foreground">
              Wellness
            </Button>
            <Button variant="ghost" className="text-foreground">
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