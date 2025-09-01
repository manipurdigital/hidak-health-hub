import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

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
    
    // Mask phone number for privacy (show only last 4 digits)
    const maskedPhone = phone?.replace(/(\d{6})(\d{4})/, '******$2') || 'N/A';
    
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
        `📞 *Phone:* ${maskedPhone}`,
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
        `📞 *Phone:* ${maskedPhone}`,
        `🧪 *Test:* ${test_name || 'Lab Test'}`,
        `📅 *Date:* ${booking_date ? new Date(booking_date).toLocaleDateString() : 'N/A'}`,
        `⏰ *Time Slot:* ${time_slot}`,
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
    
    return encodeURIComponent(message.join('\n'));
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