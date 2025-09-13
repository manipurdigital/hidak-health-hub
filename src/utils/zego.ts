import { supabase } from "@/integrations/supabase/client";

export interface ZegoCredentials {
  token: string;
  appId: number;
  roomId: string;
  userId: string;
}

export async function getZegoToken(roomId: string, userId: string): Promise<ZegoCredentials> {
  const { data, error } = await supabase.functions.invoke('zego-token', {
    body: { roomId, userId }
  });

  if (error) {
    console.error('Error getting Zego token:', error);
    throw new Error(error.message || 'Failed to get Zego token');
  }

  return data;
}