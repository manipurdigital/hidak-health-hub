import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '918794265302';

interface FirstVisitWhatsAppDialogProps {
  onClose: () => void;
}

export function FirstVisitWhatsAppDialog({ onClose }: FirstVisitWhatsAppDialogProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      "Hi! I'd like to place an order for medicines, book home lab collection, or schedule a doctor consultation. Please help me get started."
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank', 'noopener,noreferrer');
    handleClose();
  };

  const handleEnterWebsite = () => {
    localStorage.setItem('first_visit_completed', 'true');
    onClose();
    // Redirect to request flow instead of homepage
    window.location.href = '/request';
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg mx-4"
        overlayClassName="bg-background/80 backdrop-blur-sm"
        hideClose
        preventClose
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            🏥 Hakshel Healthcare Services
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-foreground">
              Please place your orders through WhatsApp for now.
            </p>
            
            {/* Animated Discount Banner */}
            <div className="animate-fade-in bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700/50 rounded-lg p-3 animate-pulse">
              <p className="text-green-700 dark:text-green-300 font-bold text-sm">
                🎉 Up to 30% discount on Generic Medicines
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✅ Medicines delivered to your doorstep</p>
              <p>✅ Home lab collection services</p>
              <p>✅ Doctor consultation scheduling</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <button
                onClick={handleWhatsAppClick}
                className="group relative inline-flex items-center justify-center gap-3 w-full h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-500/30"
                aria-label="Order healthcare services on WhatsApp"
              >
                <svg 
                  className="w-8 h-8" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.388"/>
                </svg>
                <span className="text-xl">Order on WhatsApp</span>
              </button>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                🚀 Instant response • Human support • Fast service
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}