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
    // Check if user has seen this dialog before
    const hasSeenDialog = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenDialog) {
      // Show dialog after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
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
              <p className="text-lg font-bold text-foreground mb-4">
                👇 Tap to Order on WhatsApp 👇
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="inline-block transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <img 
                  src={whatsappButtonImage} 
                  alt="Order via WhatsApp - Fast & Easy" 
                  className="h-16 w-auto mx-auto rounded-lg shadow-md"
                />
              </button>
              <p className="text-xs text-muted-foreground mt-2">
                Chat with us directly for instant ordering
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