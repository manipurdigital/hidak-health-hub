import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, ShoppingCart, Phone, FileText, Pill, Crown, Plus, Minus, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  const { itemCount, state, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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


  const handleLogin = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleCart = () => {
    navigate("/checkout");
  };

  const handleProfile = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const getNavButtonClass = (path: string) => {
    return cn(
      "text-foreground hover:text-primary hover:bg-primary/10 transition-colors",
      isActiveRoute(path) && "text-primary bg-primary/10 font-medium"
    );
  };

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-end py-2 text-sm text-muted-foreground border-b border-border">
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
          
          {/* Search moved to dedicated row below */}
          
          {/* Right actions */}
          <div className="flex items-center gap-4">
            {user && <NotificationBell />}
            {/* <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors"
              onClick={() => navigate('/care-plus')}
            >
              <Crown className="w-4 h-4" />
              Care+
            </Button> */}
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
              onClick={handleProfile}
            >
              <User className="w-4 h-4" />
              {user ? "Profile" : "Login"}
            </Button>
            <Popover open={isCartOpen} onOpenChange={setIsCartOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 relative hover:bg-accent/10 hover:text-accent transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {itemCount > 0 && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-background border shadow-lg z-50" align="end">
                <Card className="border-0 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Shopping Cart
                      {itemCount > 0 && (
                        <Badge variant="secondary">{itemCount} item{itemCount > 1 ? 's' : ''}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {state.items.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p>Your cart is empty</p>
                        <p className="text-sm mt-1">Add some medicines to get started</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-64 overflow-y-auto px-6">
                          {state.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                {item.requires_prescription && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Prescription Required
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => removeItem(item.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="text-sm font-medium">
                                ₹{(item.price * item.quantity).toFixed(0)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 border-t">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-semibold">Subtotal:</span>
                            <span className="font-semibold text-lg">₹{state.totalAmount.toFixed(0)}</span>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              navigate("/checkout");
                              setIsCartOpen(false);
                            }}
                          >
                            Go to Checkout
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Centered search row */}
        <div className="py-3">
          <div className="mx-auto w-full max-w-5xl">
            <SearchBar 
              placeholder="Search for medicines, health products, lab tests..."
              className="w-full"
              inputClassName="h-12 md:h-14 text-base"
            />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <nav className="flex items-center gap-8">
            <Button 
              variant="ghost" 
              className={getNavButtonClass('/medicines')}
              onClick={() => navigate('/medicines')}
            >
              Medicines
            </Button>
            <Button 
              variant="ghost" 
              className={getNavButtonClass('/lab-tests')}
              onClick={() => navigate('/lab-tests')}
            >
              Lab Tests
            </Button>
            <Button 
              variant="ghost" 
              className={getNavButtonClass('/doctors')}
              onClick={() => navigate('/doctors')}
            >
              Consult Doctors
            </Button>
            <Button 
              variant="ghost" 
              className={getNavButtonClass('/wellness')}
              onClick={() => navigate('/wellness')}
            >
              Wellness
            </Button>
            {/* <Button 
              variant="ghost" 
              className={getNavButtonClass('/care-plan')}
              onClick={() => navigate('/care-plan')}
            >
              Care Plan
            </Button> */}
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