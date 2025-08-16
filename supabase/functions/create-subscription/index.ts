import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const razorpayKeyId = "rzp_test_NKngyBlKJZZxzR";
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeySecret) {
      throw new Error("RAZORPAY_KEY_SECRET is not set");
    }
    logStep("Razorpay credentials verified");

    // Use service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId } = await req.json();
    if (!planId) {
      throw new Error("Plan ID is required");
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error("Invalid plan selected");
    }
    logStep("Plan retrieved", { planId, planName: plan.plan_name, price: plan.price });

    // Create Razorpay customer
    const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: user.email,
        email: user.email,
        contact: user.phone || "",
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.text();
      logStep("Customer creation failed", { error: errorData });
      throw new Error("Failed to create Razorpay customer");
    }

    const customer = await customerResponse.json();
    logStep("Razorpay customer created", { customerId: customer.id });

    // Create Razorpay subscription plan
    const planResponse = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period: plan.billing_cycle === 'yearly' ? 'yearly' : 'monthly',
        interval: 1,
        item: {
          name: plan.plan_name,
          amount: Math.round(plan.price * 100), // Convert to paisa
          currency: "INR",
          description: plan.description,
        },
      }),
    });

    if (!planResponse.ok) {
      const errorData = await planResponse.text();
      logStep("Plan creation failed", { error: errorData });
      throw new Error("Failed to create Razorpay plan");
    }

    const razorpayPlan = await planResponse.json();
    logStep("Razorpay plan created", { razorpayPlanId: razorpayPlan.id });

    // Create Razorpay subscription
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: razorpayPlan.id,
        customer_id: customer.id,
        quantity: 1,
        total_count: plan.billing_cycle === 'yearly' ? 1 : 12,
        start_at: Math.floor(Date.now() / 1000),
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      logStep("Subscription creation failed", { error: errorData });
      throw new Error("Failed to create Razorpay subscription");
    }

    const subscription = await subscriptionResponse.json();
    logStep("Razorpay subscription created", { subscriptionId: subscription.id });

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Save subscription to database
    const { data: userSubscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .insert([{
        user_id: user.id,
        plan_id: planId,
        subscription_id: subscription.id,
        customer_id: customer.id,
        status: 'active',
        current_period_start: now.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        total_amount: plan.price,
        consultations_used: 0,
      }])
      .select()
      .single();

    if (subError) {
      logStep("Database insertion failed", { error: subError });
      throw new Error("Failed to save subscription to database");
    }

    logStep("Subscription saved to database", { subscriptionId: userSubscription.id });

    return new Response(JSON.stringify({
      success: true,
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      subscription: userSubscription,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});