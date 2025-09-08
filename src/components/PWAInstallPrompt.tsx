import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Check if user has already dismissed the install prompt
    const hasPromptBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasPromptBeenDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Dialog open={showInstallPrompt} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md mx-4" hideClose preventClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Smartphone className="w-6 h-6 text-primary" />
            Install Hakshel Healthcare
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center">
              <Download className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <p className="text-lg font-semibold mb-2">
                Get faster access to healthcare
              </p>
              <p className="text-sm text-muted-foreground">
                Install our app for quick access to medicines, lab tests, and doctor consultations
              </p>
            </div>
            
            <div className="text-sm space-y-2 text-left bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Benefits:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Faster loading and offline access</li>
                <li>• Push notifications for orders</li>
                <li>• Home screen shortcut</li>
                <li>• Better mobile experience</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Maybe Later
            </Button>
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}