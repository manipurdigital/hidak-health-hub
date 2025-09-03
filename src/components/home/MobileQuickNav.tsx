import { Button } from "@/components/ui/button";
import { Upload, Pill, TestTube2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

export const MobileQuickNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { state } = useCart();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

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

  const totalItems = state.totalItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 md:hidden">
      <div className="grid grid-cols-4 gap-2 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-3"
          onClick={handleUploadPrescription}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs">Upload Rx</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-3"
          onClick={() => navigate("/medicines")}
        >
          <Pill className="w-5 h-5" />
          <span className="text-xs">Medicines</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-3"
          onClick={() => navigate("/lab-tests")}
        >
          <TestTube2 className="w-5 h-5" />
          <span className="text-xs">Lab Tests</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col gap-1 h-auto py-3 relative"
          onClick={() => navigate("/checkout")}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs">Cart</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};