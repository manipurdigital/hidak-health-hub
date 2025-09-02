
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Twilio WhatsApp Helper
const sendWhatsAppNotification = async (to: string, message: string, correlationId: string) => {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      logStep(correlationId, "Twilio credentials missing, skipping WhatsApp notification");
      return false;
    }

    // Normalize phone number to E.164 format
    const normalizedTo = normalizePhoneNumber(to);
    if (!normalizedTo) {
      logStep(correlationId, "Invalid phone number format", { to });
      return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const body = new URLSearchParams({
      From: fromNumber,
      To: `whatsapp:${normalizedTo}`,
      Body: message
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (response.ok) {
      const result = await response.json();
      logStep(correlationId, "WhatsApp notification sent successfully", { 
        to: normalizedTo, 
        sid: result.sid 
      });
      return true;
    } else {
      const errorText = await response.text();
      logStep(correlationId, "Failed to send WhatsApp notification", { 
        to: normalizedTo, 
        status: response.status, 
        error: errorText 
      });
      return false;
    }
  } catch (error) {
    logStep(correlationId, "Error sending WhatsApp notification", { 
      to, 
      error: error.message 
    });
    return false;
  }
};

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

// Build comprehensive WhatsApp message for order confirmation
const buildOrderWhatsAppMessage = (orderData: any): string => {
  const items = orderData.order_items.map((item: any) => 
    `• ${item.medicine.name} - Qty: ${item.quantity} @ ₹${item.unit_price}`
  ).join('\n');

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
    logStep('ADDRESS_PARSE', 'Failed to parse JSON address, using as plain text');
  }

  // Build GPS link with fallback sources
  if (orderData.patient_location_lat && orderData.patient_location_lng) {
    googleMapsLink = `\n📍 GPS: https://www.google.com/maps/dir/?api=1&destination=${orderData.patient_location_lat},${orderData.patient_location_lng}`;
    logStep('GPS_SOURCE', 'Using patient_location coordinates');
  } else if (orderData.dest_lat && orderData.dest_lng) {
    googleMapsLink = `\n📍 GPS: https://www.google.com/maps/dir/?api=1&destination=${orderData.dest_lat},${orderData.dest_lng}`;
    logStep('GPS_SOURCE', 'Using dest coordinates as fallback');
  } else {
    logStep('GPS_SOURCE', 'No GPS coordinates available');
  }

  return `🚨 *ORDER CONFIRMED & PAID* 🚨

📦 *Order:* ${orderData.order_number}
💳 *Payment ID:* ${orderData.razorpay_payment_id || 'N/A'}
👤 *Patient:* ${orderData.patient_name}
📱 *Phone:* ${orderData.patient_phone || 'N/A'}
💰 *Total:* ₹${orderData.total_amount}

💊 *Items Ordered:*
${items}

🏠 *Delivery Address:*
${addressStr}${googleMapsLink}

⚡ *IMPHAL AREA - ASSIGN DELIVERY RIDER NOW!*
🏥 Check admin panel for immediate assignment.`;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// Helper logging function with correlation ID
const logStep = (correlationId: string, step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [${correlationId}] ${step}${detailsStr}`);
};

// Function to verify Razorpay webhook signature
const verifyRazorpaySignature = async (body: string, signature: string, secret: string): Promise<boolean> => {
  try {
    // Import Web Crypto API
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    // Create HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the body
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures (constant time comparison would be better)
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Function to record payment event for idempotency
const recordPaymentEvent = async (
  supabaseClient: any,
  eventId: string,
  payload: any,
  signatureValid: boolean,
  correlationId: string
) => {
  const eventData = {
    id: eventId,
    payload: payload,
    signature_valid: signatureValid,
    correlation_id: correlationId,
    event_type: payload.event,
    entity_type: payload.payload?.payment?.entity ? 'payment' : 
                 payload.payload?.order?.entity ? 'order' : 
                 'unknown',
    entity_id: payload.payload?.payment?.entity?.id || 
               payload.payload?.order?.entity?.id || 
               'unknown'
  };

  // Try to insert, if it already exists, return existing record
  const { data: existingEvent, error: selectError } = await supabaseClient
    .from('payment_events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (existingEvent) {
    logStep(correlationId, "Event already exists", { eventId, processedAt: existingEvent.processed_at });
    return { isNew: false, event: existingEvent };
  }

  const { data: newEvent, error: insertError } = await supabaseClient
    .from('payment_events')
    .insert(eventData)
    .select()
    .single();

  if (insertError) {
    // Check if it's a duplicate key error (race condition)
    if (insertError.code === '23505') {
      // Another request inserted this event, fetch it
      const { data: raceEvent } = await supabaseClient
        .from('payment_events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      logStep(correlationId, "Race condition detected", { eventId });
      return { isNew: false, event: raceEvent };
    }
    throw insertError;
  }

  logStep(correlationId, "New event recorded", { eventId });
  return { isNew: true, event: newEvent };
};

// Function to update event as processed
const markEventProcessed = async (
  supabaseClient: any,
  eventId: string,
  outcome: 'success' | 'failed' | 'ignored' | 'error',
  errorDetails?: any,
  correlationId?: string
) => {
  const { error } = await supabaseClient
    .from('payment_events')
    .update({
      processed_at: new Date().toISOString(),
      outcome: outcome,
      error_details: errorDetails
    })
    .eq('id', eventId);

  if (error) {
    logStep(correlationId || 'unknown', "Error marking event processed", { eventId, error });
  } else {
    logStep(correlationId || 'unknown', "Event marked as processed", { eventId, outcome });
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  let eventId = 'unknown';

  try {
    logStep(correlationId, "Webhook received", { method: req.method, url: req.url });

    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      logStep(correlationId, "Missing signature header");
      return new Response("Missing signature", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      logStep(correlationId, "Missing webhook secret");
      return new Response("Server configuration error", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Verify signature
    const isSignatureValid = await verifyRazorpaySignature(body, signature, webhookSecret);
    logStep(correlationId, "Signature verification result", { isValid: isSignatureValid });

    const event = JSON.parse(body);
    eventId = event.id || `${event.event}_${Date.now()}`;
    
    logStep(correlationId, "Event parsed", { 
      eventId,
      event: event.event, 
      entityType: event.payload?.payment?.entity ? 'payment' : 'order'
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Record event for idempotency
    const { isNew, event: recordedEvent } = await recordPaymentEvent(
      supabaseClient,
      eventId,
      event,
      isSignatureValid,
      correlationId
    );

    // If event already processed, return success
    if (!isNew && recordedEvent.processed_at) {
      logStep(correlationId, "Event already processed", { 
        eventId, 
        outcome: recordedEvent.outcome,
        processedAt: recordedEvent.processed_at 
      });
      
      return new Response("Event already processed", { 
        status: 200,
        headers: corsHeaders 
      });
    }

    // If signature is invalid, mark as failed and return error
    if (!isSignatureValid) {
      await markEventProcessed(supabaseClient, eventId, 'failed', {
        error: 'Invalid signature',
        signature: signature.substring(0, 10) + '...'
      }, correlationId);
      
      return new Response("Invalid signature", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Process the event within a transaction-like approach
    try {
      await processWebhookEvent(supabaseClient, event, correlationId);
      
      // Mark as successfully processed
      await markEventProcessed(supabaseClient, eventId, 'success', null, correlationId);
      
      logStep(correlationId, "Webhook processed successfully", { eventId });
      return new Response("Webhook processed", { 
        status: 200,
        headers: corsHeaders 
      });

    } catch (processingError) {
      // Mark as failed
      await markEventProcessed(supabaseClient, eventId, 'error', {
        error: processingError.message,
        stack: processingError.stack
      }, correlationId);
      
      throw processingError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(correlationId, "ERROR in webhook", { 
      eventId,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response("Webhook error", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

async function processWebhookEvent(supabaseClient: any, event: any, correlationId: string) {
  // Handle different webhook events
  switch (event.event) {
    case "payment.captured":
      await handlePaymentCaptured(supabaseClient, event, correlationId);
      break;
    
    case "payment.failed":
      await handlePaymentFailed(supabaseClient, event, correlationId);
      break;
      
    case "order.paid":
      await handleOrderPaid(supabaseClient, event, correlationId);
      break;
      
    default:
      logStep(correlationId, "Unhandled event type", { event: event.event });
      // Don't throw error for unknown events, just log them
  }
}

async function handlePaymentCaptured(supabaseClient: any, event: any, correlationId: string) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  
  logStep(correlationId, "Processing payment captured", { 
    paymentId: payment.id, 
    orderId, 
    amount: payment.amount,
    captured: payment.captured,
    status: payment.status
  });

  // Validate payment is actually captured and successful
  if (payment.status !== 'captured' || !payment.captured) {
    logStep(correlationId, "Payment not captured, skipping", { 
      paymentId: payment.id, 
      status: payment.status, 
      captured: payment.captured 
    });
    return;
  }

  // Check if this is a consultation that needs backfill
  await backfillConsultationIfNeeded(supabaseClient, orderId, payment, correlationId);

  // Process manually to enforce strict validations and avoid relying on DB RPCs
  await updatePaymentStatusManually(supabaseClient, orderId, payment, 'paid', correlationId);
  
  // Send comprehensive WhatsApp notifications to admins for confirmed orders
  await sendOrderNotificationToAdmins(supabaseClient, orderId, correlationId);
  
  // Create in-app admin notification for confirmed order
  await createAdminNotification(supabaseClient, orderId, correlationId);
  
  logStep(correlationId, "Payment captured processed manually", { orderId });
}

async function handlePaymentFailed(supabaseClient: any, event: any, correlationId: string) {
  const payment = event.payload.payment.entity;
  const orderId = payment.order_id;
  
  logStep(correlationId, "Processing payment failed", { 
    paymentId: payment.id, 
    orderId,
    errorCode: payment.error_code,
    errorDescription: payment.error_description
  });

  await updatePaymentStatusManually(supabaseClient, orderId, payment, 'failed', correlationId);
}

async function handleOrderPaid(supabaseClient: any, event: any, correlationId: string) {
  const order = event.payload.order.entity;
  // Do not mark as paid on order.paid; wait for payment.captured with verified signature
  logStep(correlationId, "Ignoring order.paid; awaiting payment.captured", { orderId: order.id, amount: order.amount });
}

async function updatePaymentStatusManually(
  supabaseClient: any, 
  orderId: string, 
  payment: any, 
  status: 'paid' | 'failed',
  correlationId: string
) {
  const timestamp = new Date().toISOString();
  const newStatus = status === 'paid' ? 'confirmed' : 'cancelled';
  
  // Update medicine orders
  const { data: orders, error: orderError } = await supabaseClient
    .from('orders')
    .select('id')
    .eq('razorpay_order_id', orderId);

  if (orders && orders.length > 0) {
    for (const order of orders) {
      logStep(correlationId, "Updating medicine order", { orderId: order.id, status });
      
      const updateData = {
        payment_status: status,
        razorpay_payment_id: payment.id,
        status: newStatus,
        updated_at: timestamp
      };
      
      if (status === 'paid') {
        updateData.paid_at = timestamp;
      }
      
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) {
        logStep(correlationId, "Error updating order", { orderId: order.id, error: updateError });
        throw new Error(`Failed to update order ${order.id}: ${updateError.message}`);
      } else {
        logStep(correlationId, "Order updated successfully", { orderId: order.id, status });
      }
    }
  }

  // Update lab bookings
  const { data: bookings, error: bookingError } = await supabaseClient
    .from('lab_bookings')
    .select('id')
    .eq('razorpay_order_id', orderId);

  if (bookings && bookings.length > 0) {
    for (const booking of bookings) {
      logStep(correlationId, "Updating lab booking", { bookingId: booking.id, status });
      
      const updateData = {
        payment_status: status,
        razorpay_payment_id: payment.id,
        status: newStatus,
        updated_at: timestamp
      };
      
      if (status === 'paid') {
        updateData.paid_at = timestamp;
      }
      
      const { error: updateError } = await supabaseClient
        .from('lab_bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (updateError) {
        logStep(correlationId, "Error updating booking", { bookingId: booking.id, error: updateError });
        throw new Error(`Failed to update booking ${booking.id}: ${updateError.message}`);
      } else {
        logStep(correlationId, "Booking updated successfully", { bookingId: booking.id, status });
      }
    }
  }

  // Update consultations
  const { data: consultations, error: consultationError } = await supabaseClient
    .from('consultations')
    .select('id')
    .eq('razorpay_order_id', orderId);

  if (consultations && consultations.length > 0) {
    for (const consultation of consultations) {
      logStep(correlationId, "Updating consultation", { consultationId: consultation.id, status });
      
      // Verify the payment amount matches the consultation fee
      const { data: consultationDetails } = await supabaseClient
        .from('consultations')
        .select('total_amount')
        .eq('id', consultation.id)
        .single();

      // Only update if payment amount matches expected amount (in paise)
      const expectedAmountPaise = Math.round((consultationDetails?.total_amount || 0) * 100);
      if (status === 'paid' && payment.amount !== expectedAmountPaise) {
        logStep(correlationId, "Payment amount mismatch", { 
          consultationId: consultation.id,
          expectedAmount: expectedAmountPaise,
          actualAmount: payment.amount
        });
        return; // Skip this update
      }

      const consultationStatus = status === 'paid' ? 'scheduled' : 'cancelled';
      const updateData = {
        payment_status: status,
        razorpay_payment_id: payment.id,
        status: consultationStatus,
        updated_at: timestamp
      };
      
      if (status === 'paid') {
        updateData.paid_at = timestamp;
      }
      
      const { error: updateError } = await supabaseClient
        .from('consultations')
        .update(updateData)
        .eq('id', consultation.id);

      if (updateError) {
        logStep(correlationId, "Error updating consultation", { consultationId: consultation.id, error: updateError });
        throw new Error(`Failed to update consultation ${consultation.id}: ${updateError.message}`);
      } else {
        logStep(correlationId, "Consultation updated successfully", { consultationId: consultation.id, status });
      }
    }
  }

  if ((!orders || orders.length === 0) && (!bookings || bookings.length === 0) && (!consultations || consultations.length === 0)) {
    logStep(correlationId, "No orders, bookings, or consultations found for Razorpay order", { orderId });
    throw new Error(`No orders, bookings, or consultations found for Razorpay order ID: ${orderId}`);
  }
}

// Send WhatsApp notification to admins for new orders
async function sendOrderNotificationToAdmins(supabaseClient: any, razorpayOrderId: string, correlationId: string) {
  try {
    // Fetch the order with all details
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          medicine:medicines (
            name
          )
        )
      `)
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('status', 'confirmed')
      .single();

    if (orderError || !orderData) {
      logStep(correlationId, "Order not found for WhatsApp notification", { razorpayOrderId });
      return;
    }

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
      logStep(correlationId, "Found admin phones from profiles", { count: adminPhones.length });
    }

    // Fallback to ADMIN_WHATSAPP_TO environment variable
    const fallbackPhones = Deno.env.get('ADMIN_WHATSAPP_TO');
    if (!adminPhones.length && fallbackPhones) {
      adminPhones = fallbackPhones.split(',').map(p => p.trim()).filter(Boolean);
      logStep(correlationId, "Using fallback admin phones", { count: adminPhones.length });
    }

    if (!adminPhones.length) {
      logStep(correlationId, "No admin phone numbers found for WhatsApp notification");
      return;
    }

    // Build WhatsApp message
    const message = buildOrderWhatsAppMessage(orderData);

    // Send to all admin numbers
    let successCount = 0;
    for (const phone of adminPhones) {
      const success = await sendWhatsAppNotification(phone, message, correlationId);
      if (success) successCount++;
    }

    logStep(correlationId, "WhatsApp notifications sent to admins", { 
      totalAdmins: adminPhones.length, 
      successful: successCount,
      orderId: orderData.id 
    });

  } catch (error) {
    logStep(correlationId, "Error sending WhatsApp notifications to admins", { 
      error: error.message,
      razorpayOrderId 
    });
  }
}

async function backfillConsultationIfNeeded(supabaseClient: any, orderId: string, payment: any, correlationId: string) {
  try {
    // Check if consultation already exists for this order
    const { data: existingConsultation } = await supabaseClient
      .from('consultations')
      .select('id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (existingConsultation) {
      logStep(correlationId, "Consultation already exists, skipping backfill", { orderId });
      return;
    }

    // Fetch Razorpay order to get notes with booking metadata
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      logStep(correlationId, "Missing Razorpay credentials for backfill", { orderId });
      return;
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!razorpayResponse.ok) {
      logStep(correlationId, "Failed to fetch Razorpay order for backfill", { orderId });
      return;
    }

    const razorpayOrder = await razorpayResponse.json();
    const notes = razorpayOrder.notes;

    if (!notes || !notes.patient_id || !notes.doctor_id) {
      logStep(correlationId, "No consultation metadata in order notes", { orderId });
      return;
    }

    // Verify doctor exists and get consultation fee
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('consultation_fee, full_name')
      .eq('id', notes.doctor_id)
      .single();

    if (doctorError || !doctor) {
      logStep(correlationId, "Doctor not found for backfill", { orderId, doctorId: notes.doctor_id });
      return;
    }

    // Verify payment amount matches consultation fee
    const expectedAmount = Math.round(doctor.consultation_fee * 100);
    if (payment.amount !== expectedAmount) {
      logStep(correlationId, "Payment amount mismatch for backfill", { 
        orderId, 
        expected: expectedAmount, 
        actual: payment.amount 
      });
      return;
    }

    // Re-check slot availability
    const { data: existingBooking } = await supabaseClient
      .from('consultations')
      .select('id')
      .eq('doctor_id', notes.doctor_id)
      .eq('consultation_date', notes.consultation_date)
      .eq('time_slot', notes.time_slot)
      .maybeSingle();

    if (existingBooking) {
      logStep(correlationId, "Time slot already booked during backfill", { 
        orderId,
        doctorId: notes.doctor_id,
        date: notes.consultation_date,
        timeSlot: notes.time_slot
      });
      return;
    }

    // Create consultation record from webhook backfill
    const { data: consultation, error: consultationError } = await supabaseClient
      .from('consultations')
      .insert({
        patient_id: notes.patient_id,
        doctor_id: notes.doctor_id,
        consultation_date: notes.consultation_date,
        time_slot: notes.time_slot,
        consultation_type: notes.consultation_type || 'text',
        patient_notes: notes.patient_notes,
        total_amount: doctor.consultation_fee,
        status: 'scheduled',
        payment_status: 'paid',
        razorpay_order_id: orderId,
        razorpay_payment_id: payment.id,
        paid_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (consultationError) {
      logStep(correlationId, "Error creating consultation during backfill", { 
        orderId, 
        error: consultationError.message 
      });
      return;
    }

    logStep(correlationId, "Successfully backfilled consultation", { 
      orderId, 
      consultationId: consultation.id 
    });

  } catch (error) {
    logStep(correlationId, "Error during consultation backfill", { 
      orderId, 
      error: error.message 
    });
  }
}

// Create in-app admin notification for confirmed order
async function createAdminNotification(supabaseClient: any, razorpayOrderId: string, correlationId: string) {
  try {
    // Fetch the order details
    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        order_number,
        patient_name,
        patient_phone,
        total_amount,
        patient_location_lat,
        patient_location_lng,
        shipping_address,
        razorpay_payment_id
      `)
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('status', 'confirmed')
      .single();

    if (orderError || !orderData) {
      logStep(correlationId, "Order not found for admin notification", { razorpayOrderId });
      return;
    }

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError || !adminUsers || adminUsers.length === 0) {
      logStep(correlationId, "No admin users found for notification", { razorpayOrderId });
      return;
    }

    // Create notifications for all admins
    const adminNotifications = adminUsers.map(admin => ({
      user_id: admin.user_id,
      title: '💰 Order Confirmed & Paid',
      message: `Order ${orderData.order_number} confirmed! Patient: ${orderData.patient_name}, Amount: ₹${orderData.total_amount}. Assign delivery rider immediately.`,
      type: 'order_confirmed',
      data: {
        order_id: orderData.id,
        order_number: orderData.order_number,
        patient_name: orderData.patient_name,
        patient_phone: orderData.patient_phone,
        total_amount: orderData.total_amount,
        razorpay_payment_id: orderData.razorpay_payment_id,
        patient_location: {
          lat: orderData.patient_location_lat,
          lng: orderData.patient_location_lng
        },
        shipping_address: orderData.shipping_address,
        urgent: true,
        action_required: 'assign_delivery'
      }
    }));

    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert(adminNotifications);

    if (notificationError) {
      logStep(correlationId, "Error creating admin notifications", { 
        error: notificationError.message,
        razorpayOrderId 
      });
    } else {
      logStep(correlationId, "Admin notifications created successfully", { 
        adminCount: adminUsers.length,
        orderId: orderData.id 
      });
    }

  } catch (error) {
    logStep(correlationId, "Error in createAdminNotification", { 
      error: error.message,
      razorpayOrderId 
    });
  }
}
