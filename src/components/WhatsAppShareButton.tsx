import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppShareButtonProps {
  bookingData: {
    id: string;
    patient_name: string;
    patient_phone: string;
    booking_date: string;
    time_slot: string;
    test_name?: string;
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
  
  const generateWhatsAppMessage = () => {
    const { id, patient_name, patient_phone, booking_date, time_slot, test_name } = bookingData;
    const { lat, lng, address } = pickupLocation;
    
    // Mask phone number for privacy (show only last 4 digits)
    const maskedPhone = patient_phone.replace(/(\d{4})(\d{4})(\d{4})/, '****-****-$3');
    
    // Format address from pickup_address JSON
    let addressText = '';
    if (address) {
      const addr = typeof address === 'string' ? JSON.parse(address) : address;
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
    
    // Create Google Maps link
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    
    // Compose message
    const message = [
      '🔬 *Lab Home Collection*',
      '',
      `📋 *Booking ID:* ${id}`,
      `👤 *Patient:* ${patient_name}`,
      `📞 *Phone:* ${maskedPhone}`,
      `🧪 *Test:* ${test_name || 'Lab Test'}`,
      `📅 *Date:* ${new Date(booking_date).toLocaleDateString()}`,
      `⏰ *Time Slot:* ${time_slot}`,
      '',
      '📍 *Pickup Address:*',
      addressText || `Coordinates: ${lat}, ${lng}`,
      '',
      `🗺️ *Maps Link:* ${mapsLink}`,
      '',
      'Please navigate to the location for sample collection.'
    ].join('\n');
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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