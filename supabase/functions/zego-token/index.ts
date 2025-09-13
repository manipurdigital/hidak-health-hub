import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate Zego Cloud token using proper JWT
async function generateZegoToken(appId: number, serverSecret: string, userId: string, roomId: string): Promise<string> {
  const effectiveTimeInSeconds = 7200; // 2 hours
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: appId,
    exp: now + effectiveTimeInSeconds,
    iat: now,
    aud: "zego",
    room_id: roomId,
    user_id: userId,
    privilege: {
      1: 1, // Login privilege
      2: 1  // Publish privilege
    },
    stream_id_list: null
  };

  // Create a crypto key from the server secret
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serverSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

serve(async (req) => {
// Handle CORS preflight requests
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}

console.log('🔧 Zego token request received:', req.method);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get the user from the Authorization header
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { roomId, userId } = await req.json();
    console.log('📋 Request body parsed:', { roomId, userId });
    
    if (!roomId || !userId) {
      console.error('❌ Missing parameters:', { roomId, userId });
      return new Response(JSON.stringify({ error: 'Missing required parameters: roomId and userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appId = Deno.env.get('ZEGO_APP_ID');
    const serverSecret = Deno.env.get('ZEGO_SERVER_SECRET');
    
    console.log('🔧 Checking Zego credentials:', { 
      hasAppId: !!appId, 
      hasServerSecret: !!serverSecret,
      appIdValue: appId 
    });
    
    if (!appId || !serverSecret) {
      console.error('❌ Missing Zego credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate token
    console.log('🔐 Generating token for:', { appId: parseInt(appId), userId, roomId });
    const token = await generateZegoToken(parseInt(appId), serverSecret, userId, roomId);
    console.log('✅ Token generated successfully, length:', token.length);
    
    console.log('✅ Successfully generated Zego token for user:', user.id);

    return new Response(
      JSON.stringify({ 
        token, 
        appId: parseInt(appId), 
        roomId, 
        userId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Zego token:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});