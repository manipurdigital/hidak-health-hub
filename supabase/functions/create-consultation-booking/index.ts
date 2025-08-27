
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating consultation booking with payment...');

    if (req.method !== "POST") {
      return new Response("Method not allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    const { doctorId, consultationDate, timeSlot, consultationType = 'text', patientNotes } = await req.json();

    if (!doctorId || !consultationDate || !timeSlot) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: doctorId, consultationDate, timeSlot" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Authenticated user:', user.id);

    // Fetch doctor details
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctors')
      .select('id, full_name, consultation_fee, specialization')
      .eq('id', doctorId)
      .eq('is_available', true)
      .eq('is_verified', true)
      .single();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: "Doctor not found or not available" }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Found doctor:', doctor.full_name, 'Fee:', doctor.consultation_fee);

    // Check for existing consultation at the same slot
    const { data: existingConsultation } = await supabaseClient
      .from('consultations')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('consultation_date', consultationDate)
      .eq('time_slot', timeSlot)
      .neq('status', 'cancelled')
      .single();

    if (existingConsultation) {
      return new Response(
        JSON.stringify({ error: "This time slot is already booked" }),
        { 
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create consultation with pending status
    const { data: consultation, error: consultationError } = await supabaseClient
      .from('consultations')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        consultation_date: consultationDate,
        time_slot: timeSlot,
        consultation_type: consultationType,
        total_amount: doctor.consultation_fee,
        patient_notes: patientNotes || null,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (consultationError) {
      console.error('Error creating consultation:', consultationError);
      return new Response(
        JSON.stringify({ error: "Failed to create consultation" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Created consultation:', consultation.id);

    // Create Razorpay order
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: "Payment gateway configuration error" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const orderData = {
      amount: Math.round(doctor.consultation_fee * 100), // Convert to paise
      currency: 'INR',
      receipt: `consult_${consultation.id}`,
      notes: {
        consultation_id: consultation.id,
        doctor_name: doctor.full_name,
        patient_id: user.id
      }
    };

    console.log('Creating Razorpay order:', orderData);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay order creation failed:', errorText);
      
      // Clean up the consultation
      await supabaseClient
        .from('consultations')
        .delete()
        .eq('id', consultation.id);

      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created:', razorpayOrder.id);

    // Update consultation with Razorpay order ID
    const { error: updateError } = await supabaseClient
      .from('consultations')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', consultation.id);

    if (updateError) {
      console.error('Error updating consultation with Razorpay order ID:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        consultation_id: consultation.id,
        amount: doctor.consultation_fee,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key_id: razorpayKeyId,
        doctor_name: doctor.full_name
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Consultation booking error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
