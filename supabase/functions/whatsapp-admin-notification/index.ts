
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'new_order' | 'new_lab_booking';
  entityId: string;
  adminWhatsApp?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminWhatsAppNumber = Deno.env.get('ADMIN_WHATSAPP_TO');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { type, entityId, adminWhatsApp }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for entity ${entityId}`);

    let message = '';
    let entityData: any = null;

    if (type === 'new_order') {
      // Fetch order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            medicine:medicines (name)
          )
        `)
        .eq('id', entityId)
        .single();

      if (orderError || !order) {
        throw new Error(`Failed to fetch order: ${orderError?.message}`);
      }

      entityData = order;

      // Build WhatsApp message for new order
      const items = order.order_items.map((item: any) => 
        `• ${item.medicine.name} - Qty: ${item.quantity}`
      ).join('\n');

      const googleMapsLink = order.patient_location_lat && order.patient_location_lng 
        ? `\n📍 Location: https://www.google.com/maps/dir/?api=1&destination=${order.patient_location_lat},${order.patient_location_lng}`
        : '';

      message = `🆘 *NEW MEDICINE ORDER* 🆘

📦 *Order:* ${order.order_number}
👤 *Patient:* ${order.patient_name}
📱 *Phone:* ${order.patient_phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1xxxx$3')}
💰 *Amount:* ₹${order.total_amount}

*Medicines:*
${items}

📮 *Address:*
${order.shipping_address}${googleMapsLink}

⚡ *IMPHAL AREA - ASSIGN RIDER IMMEDIATELY!*
🏥 Check admin panel for assignment.`;

    } else if (type === 'new_lab_booking') {
      // Fetch lab booking details with location data
      const { data: booking, error: bookingError } = await supabase
        .from('lab_bookings')
        .select(`
          *,
          test:lab_tests (name)
        `)
        .eq('id', entityId)
        .single();

      if (bookingError || !booking) {
        throw new Error(`Failed to fetch lab booking: ${bookingError?.message}`);
      }

      entityData = booking;

      // Build location information
      let locationInfo = '';
      if (booking.pickup_lat && booking.pickup_lng) {
        locationInfo = `\n📍 GPS: https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`;
      }

      // Build address information
      let addressInfo = '';
      if (booking.pickup_address) {
        const addr = booking.pickup_address;
        addressInfo = `\n🏠 *Address:*\n${addr.name || 'N/A'}\n${addr.address_line_1 || ''}${addr.address_line_2 ? ', ' + addr.address_line_2 : ''}\n${addr.city || ''}, ${addr.state || ''} - ${addr.postal_code || ''}`;
        if (addr.phone) {
          addressInfo += `\n📞 Contact: ${addr.phone}`;
        }
      }

      message = `🔬 *NEW LAB HOME COLLECTION* 🔬

📋 *Booking ID:* ${booking.id}
👤 *Patient:* ${booking.patient_name}
📱 *Phone:* ${booking.patient_phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1xxxx$3')}
🧪 *Test:* ${booking.test?.name || 'Lab Test Collection'}
📅 *Date:* ${new Date(booking.booking_date).toLocaleDateString('en-IN')}
💰 *Amount:* ₹${booking.total_amount}${addressInfo}${locationInfo}

⚡ *IMPHAL AREA - ASSIGN COLLECTION AGENT!*
🏥 Check admin panel for assignment.`;
    }

    // Use provided admin WhatsApp or fallback to environment variable
    const targetWhatsApp = adminWhatsApp || adminWhatsAppNumber;

    if (!targetWhatsApp) {
      console.log('No WhatsApp number configured, logging notification instead');
      
      // Log the notification
      await supabase.from('admin_notifications').insert({
        type: 'whatsapp_notification',
        entity_type: type.replace('new_', ''),
        entity_id: entityId,
        message: message,
        status: 'no_whatsapp_configured'
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Notification logged (no WhatsApp configured)',
        whatsapp_message: message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll just log the message since we don't have WhatsApp API integration
    // In production, this would send to WhatsApp Business API
    console.log(`WhatsApp message for ${targetWhatsApp}:`, message);

    // Log successful notification
    await supabase.from('admin_notifications').insert({
      type: 'whatsapp_sent',
      entity_type: type.replace('new_', ''),
      entity_id: entityId,
      message: message,
      status: 'completed',
      processed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'WhatsApp notification prepared',
      whatsapp_message: message,
      recipient: targetWhatsApp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in whatsapp-admin-notification:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
