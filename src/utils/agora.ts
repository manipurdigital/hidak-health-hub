import { supabase } from '@/integrations/supabase/client';

export interface AgoraCredentials {
  token: string;
  appId: string;
  channelName: string;
  uid: string;
}

export async function getAgoraTokens(channelName: string, uid: string): Promise<AgoraCredentials> {
  try {
    const { data, error } = await supabase.functions.invoke('agora-tokens', {
      body: {
        channelName,
        uid,
        role: 'publisher'
      }
    });

    if (error) {
      console.error('Error getting Agora tokens:', error);
      throw new Error('Failed to get video call credentials');
    }

    return data;
  } catch (error) {
    console.error('Agora token generation failed:', error);
    throw error;
  }
}

export async function joinRtc(credentials: AgoraCredentials): Promise<void> {
  try {
    // This is a mock implementation
    // In a real app, you'd use the Agora Web SDK here
    console.log('Joining RTC with credentials:', credentials);
    
    // For demonstration, we'll just resolve successfully
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Successfully joined RTC channel:', credentials.channelName);
  } catch (error) {
    console.error('Failed to join RTC:', error);
    throw error;
  }
}

export async function leaveRtc(): Promise<void> {
  try {
    // Mock implementation for leaving RTC
    console.log('Leaving RTC channel');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Successfully left RTC channel');
  } catch (error) {
    console.error('Failed to leave RTC:', error);
    throw error;
  }
}