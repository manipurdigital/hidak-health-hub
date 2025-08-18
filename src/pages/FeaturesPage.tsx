import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  ShoppingCart, 
  TestTube, 
  Stethoscope, 
  Heart, 
  BarChart3, 
  Users, 
  MapPin, 
  Truck, 
  CreditCard, 
  Bell, 
  Shield, 
  Settings, 
  FileText,
  ExternalLink,
  Lock,
  User,
  Building,
  Microscope,
  UserCheck
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureItem {
  title: string;
  description: string;
  route?: string;
  requiredRole?: 'admin' | 'doctor' | 'lab' | 'center';
  icon: React.ReactNode;
  status?: 'available' | 'beta' | 'coming-soon';
}

interface FeatureCategory {
  title: string;
  description: string;
  features: FeatureItem[];
}

const FeaturesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["customer"]);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  const categories: FeatureCategory[] = [
    {
      title: "Customer Features",
      description: "Core features for patients and customers",
      features: [
        {
          title: "Online Pharmacy",
          description: "Browse and order medicines online with prescription upload",
          route: "/medicines",
          icon: <ShoppingCart className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Lab Tests & Diagnostics",
          description: "Book lab tests, health checkups and diagnostic services",
          route: "/lab-tests",
          icon: <TestTube className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Doctor Consultations",
          description: "Consult with certified doctors via video calls and chat",
          route: "/doctors",
          icon: <Stethoscope className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Wellness & Prevention",
          description: "Health packages, wellness plans and preventive care",
          route: "/wellness",
          icon: <Heart className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Reports & History",
          description: "Access medical reports, prescription history and health records",
          route: "/reports",
          icon: <FileText className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Order Tracking",
          description: "Real-time tracking of medicine deliveries and lab collection",
          route: "/track",
          icon: <MapPin className="w-5 h-5" />,
          status: "available"
        }
      ]
    },
    {
      title: "Admin & Management",
      description: "Advanced tools for platform administration",
      features: [
        {
          title: "Analytics Dashboard",
          description: "Comprehensive analytics, KPIs and business intelligence",
          route: "/admin/dashboard",
          requiredRole: "admin",
          icon: <BarChart3 className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "User Management",
          description: "Manage users, roles, permissions and access control",
          route: "/admin/users",
          requiredRole: "admin",
          icon: <Users className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Geofencing & Locations",
          description: "Define service areas, manage locations and serviceability",
          route: "/admin/locations",
          requiredRole: "admin",
          icon: <MapPin className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Inventory Management",
          description: "Manage medicines, lab tests, pricing and stock levels",
          route: "/admin/medicines",
          requiredRole: "admin",
          icon: <Settings className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Delivery & Assignments",
          description: "Manage delivery personnel, assignments and logistics",
          route: "/admin/delivery-assignments",
          requiredRole: "admin",
          icon: <Truck className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Lab Assignments",
          description: "Assign lab tests to collection centers and labs",
          route: "/admin/lab-assignments", 
          requiredRole: "admin",
          icon: <TestTube className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Reports & Analytics",
          description: "Generate detailed reports on orders, revenue and operations",
          route: "/admin/reports",
          requiredRole: "admin",
          icon: <FileText className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Real-time Tracking",
          description: "Monitor all deliveries and collections in real-time",
          route: "/admin/tracking",
          requiredRole: "admin",
          icon: <MapPin className="w-5 h-5" />,
          status: "available"
        }
      ]
    },
    {
      title: "Healthcare Providers",
      description: "Tools for doctors, labs and healthcare centers",
      features: [
        {
          title: "Doctor Dashboard",
          description: "Manage consultations, patients and appointments",
          route: "/doctor",
          requiredRole: "doctor",
          icon: <UserCheck className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Lab Dashboard",
          description: "Process test requests, upload results and manage samples",
          route: "/lab",
          requiredRole: "lab",
          icon: <Microscope className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Center Management",
          description: "Collection center operations and job management",
          route: "/center",
          requiredRole: "center",
          icon: <Building className="w-5 h-5" />,
          status: "available"
        }
      ]
    },
    {
      title: "Platform & Infrastructure",
      description: "Core platform capabilities and integrations",
      features: [
        {
          title: "Payment Processing",
          description: "Secure payments via Razorpay with multiple payment methods",
          icon: <CreditCard className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Notifications System",
          description: "Real-time notifications for orders, appointments and updates",
          icon: <Bell className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Authentication & Security",
          description: "Secure login, role-based access and data protection",
          icon: <Shield className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Search & Recommendations",
          description: "AI-powered search, demand prediction and personalized recommendations",
          icon: <Search className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "Google Maps Integration",
          description: "Location services, geocoding and route optimization",
          icon: <MapPin className="w-5 h-5" />,
          status: "available"
        },
        {
          title: "File Storage & Management",
          description: "Secure file uploads for prescriptions, reports and documents",
          icon: <FileText className="w-5 h-5" />,
          status: "available"
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    features: category.features.filter(feature =>
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.features.length > 0);

  const handleFeatureClick = (feature: FeatureItem) => {
    if (feature.route) {
      if (feature.requiredRole && (!user || userRole !== feature.requiredRole)) {
        // Show access restriction
        return;
      }
      navigate(feature.route);
    }
  };

  const canAccess = (feature: FeatureItem) => {
    if (!feature.requiredRole) return true;
    if (!user) return false;
    return userRole === feature.requiredRole || userRole === 'admin';
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'beta':
        return <Badge variant="secondary" className="text-xs">Beta</Badge>;
      case 'coming-soon':
        return <Badge variant="outline" className="text-xs">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const roleColors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      doctor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
      lab: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      center: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    
    return (
      <Badge className={`text-xs ${roleColors[role as keyof typeof roleColors]}`}>
        <Lock className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Platform Features & Modules
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore all the features and capabilities of our comprehensive healthcare platform.
            From patient care to advanced analytics, discover what makes our platform powerful.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <Accordion 
          type="multiple" 
          value={expandedSections} 
          onValueChange={setExpandedSections}
          className="max-w-5xl mx-auto"
        >
          {filteredCategories.map((category, index) => (
            <AccordionItem key={index} value={category.title.toLowerCase().replace(/\s+/g, '-')}>
              <AccordionTrigger className="text-left">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{category.title}</h2>
                  <p className="text-muted-foreground mt-1">{category.description}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {category.features.map((feature, featureIndex) => (
                    <Card 
                      key={featureIndex} 
                      className={`transition-all duration-200 ${
                        feature.route && canAccess(feature) 
                          ? 'hover:shadow-lg cursor-pointer hover:border-primary/50' 
                          : ''
                      } ${
                        !canAccess(feature) ? 'opacity-60' : ''
                      }`}
                      onClick={() => handleFeatureClick(feature)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              {feature.icon}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {feature.title}
                                {feature.route && canAccess(feature) && (
                                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                )}
                              </CardTitle>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {getStatusBadge(feature.status)}
                          {getRoleBadge(feature.requiredRole)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm leading-relaxed">
                          {feature.description}
                        </CardDescription>
                        {feature.requiredRole && !canAccess(feature) && (
                          <div className="mt-3 p-2 bg-muted rounded-md">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Requires {feature.requiredRole} access
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Footer CTA */}
        <div className="text-center mt-16 p-8 bg-primary/5 rounded-lg">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Ready to get started?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Whether you're a patient looking for healthcare services or a provider wanting to join our platform,
            we have the tools and features to support your needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')}>
              Explore Platform
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              {user ? 'Dashboard' : 'Sign Up'}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;