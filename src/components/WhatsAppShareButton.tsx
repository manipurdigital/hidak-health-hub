
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppShareButtonProps {
  bookingData: {
    // Lab booking data
    id?: string;
    patient_name?: string;
    patient_phone?: string;
    booking_date?: string;
    time_slot?: string;
    test_name?: string;
    // Order data
    orderNumber?: string;
    patientName?: string;
    patientPhone?: string;
    totalAmount?: number;
    medicines?: Array<{
      name: string;
      quantity: number;
    }>;
  };
  pickupLocation: {
    lat: number;
    lng: number;
    address?: any;
  };
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function WhatsAppShareButton({
  bookingData,
  pickupLocation,
  className,
  variant = 'outline',
  size = 'sm'
}: WhatsAppShareButtonProps) {
  const { toast } = useToast();
  
  const generateWhatsAppMessage = () => {
    const { 
      id, patient_name, patient_phone, booking_date, time_slot, test_name,
      orderNumber, patientName, patientPhone, totalAmount, medicines
    } = bookingData;
    const { lat, lng, address } = pickupLocation;
    
    // Determine which type of data we have
    const isOrder = orderNumber && patientName && patientPhone;
    const name = isOrder ? patientName : patient_name;
    const phone = isOrder ? patientPhone : patient_phone;
    
    // Show full phone number (no masking needed for sharing)
    
    // Create Google Maps link
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    
    let message: string[];
    
    if (isOrder) {
      // Medicine order message
      message = [
        '🏥 *Medicine Delivery*',
        '',
        `📋 *Order:* ${orderNumber}`,
        `👤 *Patient:* ${name}`,
        `📞 *Phone:* ${phone}`,
        `💰 *Amount:* ₹${totalAmount}`,
        ''
      ];
      
      if (medicines && medicines.length > 0) {
        message.push('💊 *Medicines:*');
        medicines.forEach(med => {
          message.push(`• ${med.name} (Qty: ${med.quantity})`);
        });
        message.push('');
      }
    } else {
      // Lab test message
      message = [
        '🔬 *Lab Home Collection*',
        '',
        `📋 *Booking ID:* ${id}`,
        `👤 *Patient:* ${name}`,
        `📞 *Phone:* ${phone}`,
        `🧪 *Test:* ${test_name || 'Lab Test'}`,
        `📅 *Date:* ${booking_date ? new Date(booking_date).toLocaleDateString() : 'N/A'}`,
        ...(time_slot ? [`⏰ *Time Slot:* ${time_slot}`] : []),
        ''
      ];
    }
    
    // Format address
    let addressText = '';
    if (address) {
      if (typeof address === 'string') {
        addressText = address;
      } else {
        const addr = address;
        addressText = [
          addr.address_line_1,
          addr.address_line_2,
          addr.city,
          addr.state,
          addr.pincode
        ].filter(Boolean).join(', ');
        
        if (addr.landmark) {
          addressText += ` (Near: ${addr.landmark})`;
        }
      }
    }
    
    // Add location info
    message.push('📍 *Location:*');
    message.push(addressText || `Coordinates: ${lat}, ${lng}`);
    message.push('');
    message.push(`🗺️ *Maps Link:* ${mapsLink}`);
    message.push('');
    message.push(isOrder ? 'Please navigate to the location for medicine delivery.' : 'Please navigate to the location for sample collection.');
    
    return message.join('\n');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "WhatsApp message has been copied. You can paste it in WhatsApp manually.",
      });
    } catch (error) {
      // Fallback for older browsers or if clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Copied to clipboard",
        description: "WhatsApp message has been copied. You can paste it in WhatsApp manually.",
      });
    }
  };

  const handleWhatsAppShare = async () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    try {
      // Try to open WhatsApp
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // Check if the window was blocked or failed to open
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Fallback: copy to clipboard and show toast
        await copyToClipboard(message);
        toast({
          title: "WhatsApp blocked",
          description: "Your browser blocked WhatsApp. The message has been copied to your clipboard instead.",
          variant: "default",
        });
      } else {
        // Show success message if WhatsApp opened successfully
        setTimeout(() => {
          toast({
            title: "WhatsApp opened",
            description: "The message has been prepared in WhatsApp for you to send.",
          });
        }, 1000);
      }
    } catch (error) {
      // If there's any error, fallback to copying
      await copyToClipboard(message);
      toast({
        title: "Error opening WhatsApp",
        description: "The message has been copied to your clipboard instead.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleWhatsAppShare}
      className={className}
      aria-label="Share location via WhatsApp"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Share via WhatsApp
    </Button>
  );
}
