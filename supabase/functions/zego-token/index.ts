import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate Zego Cloud token
function generateZegoToken(appId: number, serverSecret: string, userId: string, roomId: string): string {
  const effectiveTimeInSeconds = 7200; // 2 hours
  const payloadObject = {
    iss: appId,
    exp: Math.floor(Date.now() / 1000) + effectiveTimeInSeconds,
  };

  const payload = btoa(JSON.stringify(payloadObject));
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  // Create signature
  const data = `${header}.${payload}`;
  const signature = btoa(
    Array.from(
      new Uint8Array(
        new TextEncoder().encode(serverSecret + data)
      )
    ).map(byte => String.fromCharCode(byte)).join('')
  );
  
  return `${header}.${payload}.${signature}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    if (!roomId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: roomId and userId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appId = Deno.env.get('ZEGO_APP_ID');
    const serverSecret = Deno.env.get('ZEGO_SERVER_SECRET');
    
    if (!appId || !serverSecret) {
      console.error('Missing Zego credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate token
    const token = generateZegoToken(parseInt(appId), serverSecret, userId, roomId);
    
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