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
                
                <div className="flex justify-center">
                  <button
                    onClick={handleWhatsAppClick}
                    className="group relative inline-flex items-center justify-center gap-4 bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-12 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
                  >
                    <svg 
                      className="w-10 h-10" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.388"/>
                    </svg>
                    <span className="text-2xl">Order on WhatsApp</span>
                    <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
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