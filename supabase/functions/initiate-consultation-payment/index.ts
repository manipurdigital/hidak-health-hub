import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("=== INITIATE CONSULTATION PAYMENT START ===");
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { doctorId, consultationDate, timeSlot, consultationType, notes } = await req.json();
    console.log("Request data:", { doctorId, consultationDate, timeSlot, consultationType });

    if (!doctorId || !consultationDate || !timeSlot) {
      throw new Error("Missing required fields: doctorId, consultationDate, timeSlot");
    }

    // Get doctor details and verify availability
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .eq('is_available', true)
      .eq('is_verified', true)
      .single();

    if (doctorError || !doctor) {
      throw new Error("Doctor not found or not available");
    }

    // Check if slot is already booked
    const { data: existingBooking } = await supabaseClient
      .from('consultations')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('consultation_date', consultationDate)
      .eq('time_slot', timeSlot)
      .maybeSingle();

    if (existingBooking) {
      throw new Error("This time slot is already booked");
    }

    // Create Razorpay order
    const amount = Math.round(doctor.consultation_fee * 100); // Convert to paise
    const orderData = {
      amount: amount,
      currency: "INR",
      receipt: `consult_${user.id}_${Date.now()}`,
      notes: {
        patient_id: user.id,
        doctor_id: doctorId,
        consultation_date: consultationDate,
        time_slot: timeSlot,
        consultation_type: consultationType || 'text',
        patient_notes: notes || ''
      }
    };

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    console.log("Razorpay Key ID present:", !!razorpayKeyId);
    console.log("Razorpay Key Secret present:", !!razorpayKeySecret);
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Create Razorpay order via API
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay API error:", errorData);
      console.error("Razorpay response status:", razorpayResponse.status);
      throw new Error(`Failed to create Razorpay order: ${errorData}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created successfully:", razorpayOrder.id);

    return new Response(JSON.stringify({
      success: true,
      order_id: razorpayOrder.id,
      amount: doctor.consultation_fee,
      currency: 'INR',
      key_id: razorpayKeyId,
      doctor_name: doctor.full_name
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== ERROR in initiate-consultation-payment ===");
    console.error("Error initiating consultation payment:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});