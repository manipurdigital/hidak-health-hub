import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import whatsappButtonImage from '@/assets/whatsapp-button.png';

const STORAGE_KEY = 'hasSeenFirstVisitWhatsApp';
const WHATSAPP_NUMBER = '919876543210'; // Replace with actual number

export function FirstVisitWhatsAppDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Always show dialog for all visitors
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! I'd like to place an order for medicines, book home lab collection, or schedule a doctor consultation. Please help me get started."
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    handleClose();
  };

  const handleContinueOnSite = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg mx-4">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            🚀 Start Your Healthcare Journey Now!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-foreground">
              Order Instantly via WhatsApp
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>✅ Medicines delivered to your doorstep</p>
              <p>✅ Home lab collection services</p>
              <p>✅ Doctor consultations</p>
            </div>
            <p className="text-sm font-medium text-primary">
              Skip the forms - Order directly on WhatsApp for fastest service!
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-6">
                👇 Start Your Order on WhatsApp 👇
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="group relative inline-flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              >
                <svg 
                  className="w-8 h-8" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.388"/>
                </svg>
                <span className="text-xl">Order on WhatsApp</span>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <p className="text-sm text-muted-foreground mt-4 font-medium">
                🚀 Instant response • Human support • No forms required
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 my-3">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
            </div>

            <Button 
              onClick={handleContinueOnSite}
              variant="outline" 
              className="w-full"
            >
              Browse Website (Longer Process)
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            You can always switch between WhatsApp and our website anytime
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}