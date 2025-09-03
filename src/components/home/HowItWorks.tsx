import { Card, CardContent } from "@/components/ui/card";
import { Upload, ShoppingCart, Truck } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      title: "Upload Prescription",
      description: "Take a photo of your prescription or upload from gallery",
      icon: <Upload className="w-8 h-8" />,
      color: "bg-primary/10 text-primary"
    },
    {
      step: 2,
      title: "Place Order",
      description: "Review medicines, add to cart and place your order",
      icon: <ShoppingCart className="w-8 h-8" />,
      color: "bg-accent/10 text-accent"
    },
    {
      step: 3,
      title: "Get Delivered",
      description: "Receive authentic medicines at your doorstep",
      icon: <Truck className="w-8 h-8" />,
      color: "bg-success/10 text-success"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting your medicines delivered is simple and secure
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mx-auto mb-6`}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-muted transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};