import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user's current subscription with plan details
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      throw new Error(`Database error: ${subError.message}`);
    }

    // Get subscription usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    let usage = null;
    if (subscription) {
      const { data: usageData } = await supabaseClient
        .from('subscription_usage')
        .select('*')
        .eq('subscription_id', subscription.id)
        .eq('month_year', currentMonth);
      
      usage = usageData || [];
    }

    return new Response(JSON.stringify({
      has_subscription: !!subscription,
      subscription: subscription || null,
      usage: usage || [],
      current_month: currentMonth,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});