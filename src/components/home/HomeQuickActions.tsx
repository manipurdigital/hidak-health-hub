import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Pill, TestTube2, Video, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const HomeQuickActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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
    // This would open a prescription upload modal/flow
    toast({
      title: "Upload Prescription",
      description: "Opening prescription upload...",
    });
  };

  const actions = [
    {
      id: "upload-rx",
      title: "Upload Prescription",
      subtitle: "Get medicines delivered",
      icon: <Upload className="w-8 h-8" />,
      action: handleUploadPrescription,
      color: "bg-primary text-primary-foreground",
      featured: true
    },
    {
      id: "order-medicines",
      title: "Order Medicines",
      subtitle: "Browse & buy online",
      icon: <Pill className="w-8 h-8" />,
      action: () => navigate("/medicines"),
      color: "bg-medical text-medical-foreground"
    },
    {
      id: "book-lab-test",
      title: "Lab Tests",
      subtitle: "Home sample collection",
      icon: <TestTube2 className="w-8 h-8" />,
      action: () => navigate("/lab-tests"),
      color: "bg-success text-success-foreground"
    },
    {
      id: "consult-doctor",
      title: "Consult Doctor",
      subtitle: "Video consultation",
      icon: <Video className="w-8 h-8" />,
      action: () => navigate("/doctors"),
      color: "bg-accent text-accent-foreground",
      show: isFeatureEnabled("ENABLE_CONSULTATIONS")
    }
  ].filter(action => action.show !== false);

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Quick Actions</h2>
          <p className="text-muted-foreground">Get started with just one tap</p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {actions.map((action) => (
            <Card 
              key={action.id}
              className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden border-0 ${
                action.featured ? 'lg:col-span-2' : ''
              }`}
              onClick={action.action}
            >
              <CardContent className={`p-6 text-center ${action.color} relative`}>
                <div className="mb-4 flex justify-center">
                  {action.icon}
                </div>
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm opacity-90 mb-4">{action.subtitle}</p>
                <ArrowRight className="w-5 h-5 mx-auto group-hover:translate-x-1 transition-transform duration-200" />
                
                {action.featured && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Most Popular</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};