import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Copy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionButtonsProps {
  whatsappMessage: string;
  phoneNumber?: string;
  onWhatsAppSend?: () => void;
}

export function QuickActionButtons({ 
  whatsappMessage, 
  phoneNumber, 
  onWhatsAppSend 
}: QuickActionButtonsProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = (message: string, phone?: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = phone 
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    onWhatsAppSend?.();
  };

  const callPhoneNumber = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(whatsappMessage)}
        className="flex-1"
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy Message
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => openWhatsApp(whatsappMessage, phoneNumber)}
        className="flex-1"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>

      {phoneNumber && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => callPhoneNumber(phoneNumber)}
        >
          <Phone className="h-4 w-4 mr-2" />
          Call
        </Button>
      )}

      <Button
        onClick={() => {
          const customPhone = prompt("Enter WhatsApp number:");
          if (customPhone) {
            openWhatsApp(whatsappMessage, customPhone);
          }
        }}
        size="sm"
        className="flex-1"
      >
        <Send className="h-4 w-4 mr-2" />
        Send Custom
      </Button>
    </div>
  );
}