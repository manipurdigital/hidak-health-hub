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
      "Hi! I'm interested in your services. I'd like to know more about placing medicine orders, booking home lab collections, and doctor consultations."
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    handleClose();
  };

  const handleContinueOnSite = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4">
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
          <DialogTitle className="text-center text-xl font-semibold text-foreground">
            Welcome! Get Started Instantly
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Choose how you'd like to get started with our healthcare services:
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Order medicines with home delivery</p>
              <p>• Book convenient home lab collection</p>
              <p>• Schedule doctor consultations</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-3">
                Quick & Easy via WhatsApp
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="inline-block transition-transform hover:scale-105"
              >
                <img 
                  src={whatsappButtonImage} 
                  alt="Order via WhatsApp" 
                  className="h-12 w-auto mx-auto"
                />
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <span>OR</span>
            </div>

            <Button 
              onClick={handleContinueOnSite}
              variant="outline" 
              className="w-full"
            >
              Continue Browsing Our Website
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