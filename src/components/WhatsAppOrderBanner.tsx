import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Clock, Truck } from 'lucide-react';
import whatsappButtonImage from '@/assets/whatsapp-button.png';

const WHATSAPP_NUMBER = '919876543210'; // Replace with actual number

export function WhatsAppOrderBanner() {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! I'd like to place an order. Please help me with:\n\n1. Medicine delivery\n2. Home lab collection\n3. Doctor consultation\n\nThank you!"
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleCallClick = () => {
    window.open(`tel:+${WHATSAPP_NUMBER}`, '_self');
  };

  return (
    <div className="w-full bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2 border-green-200 dark:border-green-800 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  🚀 Order Instantly on WhatsApp!
                </h2>
                <p className="text-lg text-muted-foreground">
                  Skip the forms - Get your healthcare needs sorted in minutes
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <Truck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-semibold">Medicine Delivery</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Order medicines with same-day delivery
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="font-semibold">Home Lab Collection</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Book lab tests from the comfort of your home
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="font-semibold">Doctor Consultations</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Connect with certified doctors instantly
                  </p>
                </div>
              </div>

              {/* Main CTA */}
              <div className="space-y-4">
                <p className="text-xl font-bold text-foreground">
                  👇 Start Your Order Now 👇
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={handleWhatsAppClick}
                    className="transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <img 
                      src={whatsappButtonImage} 
                      alt="Order via WhatsApp - Instant Service" 
                      className="h-20 w-auto rounded-lg shadow-lg"
                    />
                  </button>
                  
                  <div className="text-center text-sm text-muted-foreground">
                    <span>OR</span>
                  </div>
                  
                  <Button
                    onClick={handleCallClick}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call Now
                  </Button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 inline-block">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    💡 Pro Tip: WhatsApp orders are processed 2x faster!
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span>No Registration</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span>Instant Response</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span>Human Support</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}