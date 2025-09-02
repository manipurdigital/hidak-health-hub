
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-LAB-BOOKING] ${step}${detailsStr}`);
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
    const { 
      testId, 
      bookingDate, 
      patientName, 
      patientPhone, 
      patientEmail, 
      specialInstructions,
      pickupLat,
      pickupLng,
      pickupAddress
    } = body;

    if (!testId || !bookingDate || !patientName || !patientPhone) {
      throw new Error("Missing required booking information");
    }

    // Validate pickup coordinates if provided
    if (pickupLat !== undefined && pickupLng !== undefined) {
      if (pickupLat < -90 || pickupLat > 90 || pickupLng < -180 || pickupLng > 180) {
        throw new Error("Invalid GPS coordinates");
      }
    }

    logStep("Request validated", { testId, bookingDate, pickupLat, pickupLng });

    // Get test details
    const { data: test, error: testError } = await supabaseClient
      .from('lab_tests')
      .select('*')
      .eq('id', testId)
      .eq('is_active', true)
      .single();

    if (testError || !test) {
      logStep("Test not found", { testId, error: testError });
      throw new Error("Test not found or not available");
    }

    logStep("Test found", { testName: test.name, price: test.price });

    // Check date availability (basic check - can be enhanced with proper capacity management)
    const { data: existingBookings, error: dateError } = await supabaseClient
      .from('lab_bookings')
      .select('id')
      .eq('test_id', testId)
      .eq('booking_date', bookingDate)
      .in('status', ['confirmed', 'pending', 'assigned']);

    if (dateError) {
      logStep("Error checking date availability", dateError);
      throw new Error("Error checking date availability");
    }

    // Simple daily limit (can be enhanced based on test capacity)
    if (existingBookings && existingBookings.length >= 20) {
      logStep("Date unavailable", { existingBookings: existingBookings.length });
      throw new Error("Selected date is not available for collection");
    }

    logStep("Date available", { existingBookings: existingBookings?.length || 0 });

    // Create lab booking with GPS location and address data
    const bookingData: any = {
      user_id: user.id,
      test_id: testId,
      booking_date: bookingDate,
      patient_name: patientName,
      patient_phone: patientPhone,
      notes: specialInstructions || null,
      total_amount: test.price,
      status: 'pending',
      payment_status: 'pending'
    };

    // Add GPS coordinates if provided
    if (pickupLat !== undefined && pickupLng !== undefined) {
      bookingData.pickup_lat = pickupLat;
      bookingData.pickup_lng = pickupLng;
      logStep("GPS coordinates added", { pickupLat, pickupLng });
    }

    // Add address data if provided
    if (pickupAddress) {
      bookingData.pickup_address = pickupAddress;
      logStep("Address data added", { addressPreview: pickupAddress.name || 'No name' });
    }

    const { data: booking, error: bookingError } = await supabaseClient
      .from('lab_bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      logStep("Error creating booking", bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    logStep("Booking created with location data", { 
      bookingId: booking.id, 
      hasGPS: !!(pickupLat && pickupLng),
      hasAddress: !!pickupAddress 
    });

    // Create Razorpay order for lab booking
    const razorpayKeyId = "rzp_test_NKngyBlKJZZxzR";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret key not configured");
    }

    const razorpayOrderData = {
      amount: Math.round(test.price * 100), // Convert to paisa
      currency: "INR",
      receipt: `LAB_${booking.id}`,
      notes: {
        booking_id: booking.id,
        test_id: testId,
        user_id: user.id,
        type: "lab_booking"
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

    // Update booking with Razorpay order ID
    const { error: updateError } = await supabaseClient
      .from('lab_bookings')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', booking.id);

    if (updateError) {
      logStep("Error updating booking with Razorpay ID", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        test_name: test.name,
        booking_date: bookingDate,
        total_amount: test.price,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        pickup_lat: booking.pickup_lat,
        pickup_lng: booking.pickup_lng,
        pickup_address: booking.pickup_address
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-lab-booking", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
