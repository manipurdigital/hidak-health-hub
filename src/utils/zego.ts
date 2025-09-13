import { supabase } from "@/integrations/supabase/client";

export interface ZegoCredentials {
  token: string;
  appId: number;
  roomId: string;
  userId: string;
}

export async function getZegoToken(roomId: string, userId: string): Promise<ZegoCredentials> {
  console.log('🔐 Getting Zego token for:', { roomId, userId });
  
  try {
    const { data, error } = await supabase.functions.invoke('zego-token', {
      body: { roomId, userId }
    });

    if (error) {
      console.error('❌ Error getting Zego token:', error);
      throw new Error(error.message || 'Failed to get Zego token');
    }

    if (!data || !data.token || !data.appId) {
      console.error('❌ Invalid Zego token response:', data);
      throw new Error('Invalid token response from server');
    }

    console.log('✅ Successfully got Zego token response:', {
      appId: data.appId,
      roomId: data.roomId,
      userId: data.userId,
      tokenLength: data.token?.length
    });
    
    return data;
  } catch (error: any) {
    console.error('❌ Failed to get Zego token:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('fetch')) {
      throw new Error('Network error: Could not connect to video service');
    } else if (error.message?.includes('JWT')) {
      throw new Error('Authentication error: Invalid token');
    } else {
      throw new Error(error.message || 'Failed to initialize video call');
    }
  }
}