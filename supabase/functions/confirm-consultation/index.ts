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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userResp } = await supabaseClient.auth.getUser();
    const user = userResp.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      doctorId,
      consultationDate,
      timeSlot,
      consultationType,
      notes
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing payment verification data");
    }

    // Verify Razorpay signature
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) {
      throw new Error("Missing Razorpay secret");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(body);
    const keyData = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageBytes);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSignature.toLowerCase() !== String(razorpay_signature).toLowerCase()) {
      throw new Error("Invalid payment signature");
    }

    // Re-check slot availability to prevent double booking
    const { data: existingBooking } = await supabaseClient
      .from('consultations')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('consultation_date', consultationDate)
      .eq('time_slot', timeSlot)
      .maybeSingle();

    if (existingBooking) {
      throw new Error("This time slot is already booked. Please select another slot or contact support for a refund.");
    }

    // Get doctor details for amount verification
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('consultation_fee, full_name')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      throw new Error("Doctor not found");
    }

    // Create consultation record
    const { data: consultation, error: consultationError } = await supabaseClient
      .from('consultations')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        consultation_date: consultationDate,
        time_slot: timeSlot,
        consultation_type: consultationType || 'text',
        patient_notes: notes,
        total_amount: doctor.consultation_fee,
        status: 'scheduled',
        payment_status: 'paid',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        paid_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (consultationError) {
      console.error("Error creating consultation:", consultationError);
      throw new Error("Failed to create consultation record");
    }

    return new Response(JSON.stringify({
      success: true,
      consultation_id: consultation.id,
      doctor_name: doctor.full_name
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error confirming consultation:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});