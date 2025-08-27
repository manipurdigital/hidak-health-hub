
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  // Process manually to enforce strict validations and avoid relying on DB RPCs
  await updatePaymentStatusManually(supabaseClient, orderId, payment, 'paid', correlationId);
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
