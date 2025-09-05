import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora RTC Token privileges
const RTC_ROLE = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
};

// Use official Agora Access Token builder via ESM
import { RtcTokenBuilder, RtcRole } from "https://esm.sh/agora-access-token@2.0.2";

// Official token generator using Agora library
function generateAgoraToken(appId: string, appCertificate: string, channelName: string, uid: string, role: number, expireTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = now + expireTime; // seconds

  const rtcRole = role === RtcRole.PUBLISHER ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // For Web SDK, using account (string) UID is recommended
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    String(uid),
    rtcRole,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return token;
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

    const { channelName, uid, role = 'publisher' } = await req.json();
    if (!channelName || !uid) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: channelName and uid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');
    if (!appId || !appCertificate) {
      console.error('Missing Agora credentials');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate token
    const roleNum = role === 'publisher' ? RTC_ROLE.PUBLISHER : RTC_ROLE.SUBSCRIBER;
    const expireTime = 3600; // 1 hour
    const token = await generateAgoraToken(appId, appCertificate, channelName, uid, roleNum, expireTime);
    const expiresAt = Math.floor(Date.now() / 1000) + expireTime;
    
    console.log('✅ Successfully generated Agora token for user:', user.id);

    return new Response(
      JSON.stringify({ 
        token, 
        appId, 
        channelName, 
        uid, 
        role, 
        expiresAt 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});