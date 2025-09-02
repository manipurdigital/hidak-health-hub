
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ORDER] ${step}${detailsStr}`);
};

// Twilio WhatsApp configuration
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_WHATSAPP_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM');

// Normalize phone number to E.164 format
const normalizePhoneNumber = (phone: string): string | null => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle Indian numbers (10 digits, add +91)
  if (digits.length === 10 && digits.startsWith('9')) {
    return `+91${digits}`;
  }
  
  // Handle numbers with country code already
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  
  // Handle numbers starting with +
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: assume Indian number if 10 digits
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  return null;
};

async function sendWhatsAppNotification(to: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    logStep('Twilio WhatsApp credentials not configured, skipping WhatsApp notification');
    return false;
  }

  try {
    // Normalize phone number
    const normalizedTo = normalizePhoneNumber(to);
    if (!normalizedTo) {
      logStep('Invalid phone number format', { to });
      return false;
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: `whatsapp:${normalizedTo}`,
          Body: message,
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      logStep('WhatsApp notification sent successfully', { to: normalizedTo, sid: result.sid });
      return true;
    } else {
      const errorText = await response.text();
      logStep('Failed to send WhatsApp notification', { to: normalizedTo, status: response.status, error: errorText });
      return false;
    }
  } catch (error) {
    logStep('Error sending WhatsApp notification', { to, error: error.message });
    return false;
  }
}

// Build WhatsApp message for COD order notification
const buildCODOrderWhatsAppMessage = (orderData: any): string => {
  const items = orderData.order_items?.map((item: any) => 
    `• ${item.medicine?.name || 'Unknown medicine'} - Qty: ${item.quantity} @ ₹${item.unit_price}`
  ).join('\n') || 'No items specified';

  // Parse shipping address if it's a JSON string, otherwise use as is
  let addressStr = orderData.shipping_address;
  let googleMapsLink = '';
  
  try {
    if (typeof addressStr === 'string' && addressStr.startsWith('{')) {
      const addr = JSON.parse(addressStr);
      addressStr = `${addr.name || ''}\n${addr.address_line_1 || ''}${addr.address_line_2 ? ', ' + addr.address_line_2 : ''}\n${addr.city || ''}, ${addr.state || ''} - ${addr.postal_code || ''}`;
      if (addr.phone) addressStr += `\n📞 Contact: ${addr.phone}`;
    }
  } catch (e) {
    // Use as plain text if parsing fails
  }

  // Build GPS link with fallback sources
  if (orderData.patient_location_lat && orderData.patient_location_lng) {
    googleMapsLink = `\n📍 GPS: https://www.google.com/maps/dir/?api=1&destination=${orderData.patient_location_lat},${orderData.patient_location_lng}`;
  }

  return `💰 *COD ORDER CONFIRMED* 💰

📦 *Order:* ${orderData.order_number}
👤 *Patient:* ${orderData.patient_name}
📱 *Phone:* ${orderData.patient_phone || 'N/A'}
💰 *Total:* ₹${orderData.total_amount} (COD)

💊 *Items Ordered:*
${items}

🏠 *Delivery Address:*
${addressStr}${googleMapsLink}

⚡ *CASH ON DELIVERY - ASSIGN RIDER NOW!*
💵 Collect ₹${orderData.total_amount} from customer at delivery.
🏥 Check admin panel for immediate assignment.`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { items, shippingAddress, prescriptionUrl, notes, patientName, patientPhone, patientLocation, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    if (!shippingAddress) {
      throw new Error("Shipping address is required");
    }

    if (!patientName || !patientPhone) {
      throw new Error("Patient name and phone are required");
    }

    logStep("Request validated", { 
      itemCount: items.length, 
      hasShipping: !!shippingAddress,
      patientName,
      patientPhone,
      paymentMethod: paymentMethod || 'prepaid',
      hasLocation: !!(patientLocation?.lat && patientLocation?.lng)
    });

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    logStep("Order calculations", { totalAmount });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${user.id.substring(0, 8)}`;
    
    // Handle payment method
    const isCOD = paymentMethod === 'cod';
    let razorpayOrder = null;

    if (!isCOD) {
      // Create Razorpay order for prepaid orders
      const razorpayKeyId = "rzp_test_NKngyBlKJZZxzR"; // Publishable key
      const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

      if (!razorpayKeySecret) {
        throw new Error("Razorpay secret key not configured");
      }

      const razorpayOrderData = {
        amount: Math.round(totalAmount * 100), // Convert to paisa
        currency: "INR",
        receipt: orderNumber,
        notes: {
          user_id: user.id,
          patient_name: patientName,
          patient_phone: patientPhone
        }
      };

      logStep("Creating Razorpay order", razorpayOrderData);

      const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(razorpayOrderData),
      });

      if (!razorpayResponse.ok) {
        const errorText = await razorpayResponse.text();
        logStep("Razorpay API error", { status: razorpayResponse.status, error: errorText });
        throw new Error(`Razorpay API error: ${errorText}`);
      }

      razorpayOrder = await razorpayResponse.json();
      logStep("Razorpay order created", { razorpayOrderId: razorpayOrder.id });
    } else {
      logStep("COD order - skipping Razorpay", { orderNumber });
    }

    // Create order in database
    const orderData = {
      user_id: user.id,
      order_number: orderNumber,
      total_amount: totalAmount,
      shipping_address: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      patient_name: patientName,
      patient_phone: patientPhone,
      patient_location_lat: patientLocation?.lat || null,
      patient_location_lng: patientLocation?.lng || null,
      notes: notes || null,
      payment_method: paymentMethod || 'prepaid',
      status: isCOD ? 'confirmed' : 'pending',
      payment_status: isCOD ? 'pending' : 'pending'
    };

    // Add Razorpay order ID for prepaid orders
    if (!isCOD && razorpayOrder) {
      orderData.razorpay_order_id = razorpayOrder.id;
    }

    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id, orderNumber: order.order_number });

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      medicine_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      logStep("Error creating order items", itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    logStep("Order items created", { itemCount: orderItems.length });

    // Handle notifications based on payment method
    if (isCOD) {
      // For COD orders, send immediate comprehensive notifications
      await sendCODOrderNotifications(supabaseClient, order, items, order.order_number);
    } else {
      // For prepaid orders, create only pending payment notifications
      await createPendingPaymentNotifications(supabaseClient, order, patientName, patientPhone, totalAmount, patientLocation);
    }

    // Prepare response data
    const responseData = {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount,
        payment_method: paymentMethod || 'prepaid'
      }
    };

    // Add Razorpay data for prepaid orders
    if (!isCOD && razorpayOrder) {
      responseData.order.razorpay_order_id = razorpayOrder.id;
      responseData.order.razorpay_key_id = "rzp_test_NKngyBlKJZZxzR";
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-order", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Send comprehensive notifications for COD orders
async function sendCODOrderNotifications(supabaseClient: any, order: any, items: any[], correlationId: string) {
  try {
    // Get admin phone numbers from profiles
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from('user_roles')
      .select(`
        user_id,
        profiles!inner (
          phone
        )
      `)
      .eq('role', 'admin')
      .not('profiles.phone', 'is', null);

    let adminPhones: string[] = [];
    
    if (adminUsers && adminUsers.length > 0) {
      adminPhones = adminUsers
        .map((admin: any) => admin.profiles?.phone)
        .filter(Boolean);
      logStep("Found admin phones from profiles", { count: adminPhones.length });
    }

    // Fallback to ADMIN_WHATSAPP_TO environment variable
    const fallbackPhones = Deno.env.get('ADMIN_WHATSAPP_TO');
    if (!adminPhones.length && fallbackPhones) {
      adminPhones = fallbackPhones.split(',').map(p => p.trim()).filter(Boolean);
      logStep("Using fallback admin phones", { count: adminPhones.length });
    }

    if (adminPhones.length > 0) {
      // Prepare order data for WhatsApp message
      const orderDataForMessage = {
        ...order,
        order_items: items.map(item => ({
          quantity: item.quantity,
          unit_price: item.price,
          medicine: { name: item.name }
        }))
      };

      const message = buildCODOrderWhatsAppMessage(orderDataForMessage);
      
      // Send to all admin numbers
      let successCount = 0;
      for (const phone of adminPhones) {
        const success = await sendWhatsAppNotification(phone, message);
        if (success) successCount++;
      }

      logStep("COD WhatsApp notifications sent to admins", { 
        totalAdmins: adminPhones.length, 
        successful: successCount,
        orderId: order.id 
      });
    } else {
      logStep("No admin phone numbers found for COD WhatsApp notification");
    }

    // Create in-app notifications for all admins
    const { data: allAdminUsers } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (allAdminUsers && allAdminUsers.length > 0) {
      const adminNotifications = allAdminUsers.map(admin => ({
        user_id: admin.user_id,
        title: '💰 COD Order Confirmed',
        message: `COD Order ${order.order_number} from ${order.patient_name}. Total: ₹${order.total_amount}. Assign delivery rider immediately!`,
        type: 'order_cod_confirmed',
        data: {
          order_id: order.id,
          order_number: order.order_number,
          patient_name: order.patient_name,
          patient_phone: order.patient_phone,
          total_amount: order.total_amount,
          payment_method: 'cod',
          patient_location: {
            lat: order.patient_location_lat,
            lng: order.patient_location_lng
          },
          shipping_address: order.shipping_address,
          urgent: true,
          action_required: 'assign_delivery'
        }
      }));

      await supabaseClient.from('notifications').insert(adminNotifications);
      logStep("COD admin notifications created", { adminCount: allAdminUsers.length });
    }
    
  } catch (notificationError) {
    logStep("Error sending COD notifications", notificationError);
    // Don't fail the order creation if notifications fail
  }
}

// Create pending payment notifications for prepaid orders
async function createPendingPaymentNotifications(supabaseClient: any, order: any, patientName: string, patientPhone: string, totalAmount: number, patientLocation: any) {
  try {
    const { data: allAdminUsers } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (allAdminUsers && allAdminUsers.length > 0) {
      const adminNotifications = allAdminUsers.map(admin => ({
        user_id: admin.user_id,
        title: 'New Order - Pending Payment',
        message: `Order ${order.order_number} created by ${patientName}. Total: ₹${totalAmount}. Awaiting payment confirmation.`,
        type: 'order_pending',
        data: {
          order_id: order.id,
          order_number: order.order_number,
          patient_name: patientName,
          patient_phone: patientPhone,
          total_amount: totalAmount,
          patient_location: patientLocation,
          status: 'pending_payment'
        }
      }));

      await supabaseClient.from('notifications').insert(adminNotifications);
      logStep("Pending payment notifications created", { adminCount: allAdminUsers.length });
    }
    
  } catch (notificationError) {
    logStep("Error creating pending notifications", notificationError);
    // Don't fail the order creation if notifications fail
  }
}
