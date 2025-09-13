import { supabase } from "@/integrations/supabase/client";

export interface ZegoCredentials {
  token: string;
  appId: number;
  roomId: string;
  userId: string;
}

export async function getZegoToken(roomId: string, userId: string, retries: number = 3): Promise<ZegoCredentials> {
  console.log('🔐 Getting Zego token for:', { roomId, userId, retries });
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke('zego-token', {
        body: { roomId, userId }
      });

      if (error) {
        console.error(`❌ Error getting Zego token (attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw new Error(error.message || 'Failed to get Zego token');
        }
        continue;
      }

      if (!data || !data.token || !data.appId) {
        console.error(`❌ Invalid Zego token response (attempt ${attempt}):`, data);
        if (attempt === retries) {
          throw new Error('Invalid token response from server');
        }
        continue;
      }

      console.log('✅ Successfully got Zego token response:', {
        appId: data.appId,
        roomId: data.roomId,
        userId: data.userId,
        tokenLength: data.token?.length,
        attempt
      });
      
      return data;
    } catch (error: any) {
      console.error(`❌ Failed to get Zego token (attempt ${attempt}):`, error);
      
      if (attempt === retries) {
        // Provide more specific error messages
        if (error.message?.includes('fetch')) {
          throw new Error('Network error: Could not connect to video service');
        } else if (error.message?.includes('JWT')) {
          throw new Error('Authentication error: Invalid token');
        } else {
          throw new Error(error.message || 'Failed to initialize video call');
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to get Zego token after retries');
}