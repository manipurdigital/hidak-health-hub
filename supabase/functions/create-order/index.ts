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

async function sendWhatsAppNotification(to: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) {
    logStep('Twilio WhatsApp credentials not configured, skipping WhatsApp notification');
    return;
  }

  try {
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
          To: to,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logStep('Failed to send WhatsApp message', error);
    } else {
      logStep('WhatsApp notification sent successfully');
    }
  } catch (error) {
    logStep('Error sending WhatsApp notification', error);
  }
}

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
    const { items, shippingAddress, prescriptionUrl, notes, patientName, patientPhone, patientLocation } = body;

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
      hasLocation: !!(patientLocation?.lat && patientLocation?.lng)
    });

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Check if any item requires prescription
    const prescriptionRequired = items.some((item: any) => item.requires_prescription);

    logStep("Order calculations", { totalAmount, prescriptionRequired });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${user.id.substring(0, 8)}`;

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        shipping_address: JSON.stringify(shippingAddress),
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_location_lat: patientLocation?.lat || null,
        patient_location_lng: patientLocation?.lng || null,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending'
      })
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

    // Create Razorpay order
    const razorpayKeyId = "rzp_test_NKngyBlKJZZxzR"; // Publishable key
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret key not configured");
    }

    const razorpayOrderData = {
      amount: Math.round(totalAmount * 100), // Convert to paisa
      currency: "INR",
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        user_id: user.id
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

    const razorpayOrder = await razorpayResponse.json();
    logStep("Razorpay order created", { razorpayOrderId: razorpayOrder.id });

    // Update order with Razorpay order ID
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id);

    if (updateError) {
      logStep("Error updating order with Razorpay ID", updateError);
    }

    // Send notifications to admins
    try {
      // Get all admin users
      const { data: adminUsers, error: adminError } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminError && adminUsers) {
        // Create in-app notifications for all admins
        const adminNotifications = adminUsers.map(admin => ({
          user_id: admin.user_id,
          title: 'New Medicine Order',
          message: `New order ${order.order_number} received from ${patientName}. Total: ₹${totalAmount}`,
          type: 'order',
          data: {
            order_id: order.id,
            order_number: order.order_number,
            patient_name: patientName,
            patient_phone: patientPhone,
            total_amount: totalAmount,
            patient_location: patientLocation
          }
        }));

        await supabaseClient.from('notifications').insert(adminNotifications);
        logStep("Admin notifications created", { adminCount: adminUsers.length });
      }

      // Send WhatsApp notification to admin (if configured)
      // In a real scenario, you'd store admin phone numbers and send to multiple admins
      // For now, we'll just log that this would happen
      logStep("WhatsApp notification would be sent to admin phone numbers");
      
    } catch (notificationError) {
      logStep("Error sending notifications", notificationError);
      // Don't fail the order creation if notifications fail
    }

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: totalAmount,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId
      }
    }), {
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