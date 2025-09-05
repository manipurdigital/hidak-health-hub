import { supabase } from '@/integrations/supabase/client';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

export interface AgoraCredentials {
  token: string;
  appId: string;
  channelName: string;
  uid: string;
  role?: string;
}

export interface AgoraClient {
  client: IAgoraRTCClient;
  localVideoTrack?: ICameraVideoTrack;
  localAudioTrack?: IMicrophoneAudioTrack;
  uid: string;
}

let agoraClient: AgoraClient | null = null;

export async function getAgoraTokens(channelName: string, uid: string): Promise<AgoraCredentials> {
  console.log('🔑 Requesting Agora tokens for channel:', channelName, 'uid:', uid);
  
  try {
    const { data, error } = await supabase.functions.invoke('agora-tokens', {
      body: { channelName, uid, role: 'publisher' }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw new Error(`Token service error: ${error.message}`);
    }

    if (!data || !data.token || !data.appId) {
      console.error('❌ Invalid response from agora-tokens function:', data);
      throw new Error('Invalid token response - missing required fields');
    }

    console.log('✅ Successfully obtained Agora tokens:', {
      hasToken: !!data.token,
      appId: data.appId,
      channelName: data.channelName,
      uid: data.uid,
      expiresAt: data.expiresAt
    });
    
    return {
      token: data.token,
      appId: data.appId,
      channelName: data.channelName || channelName,
      uid: data.uid || uid
    };
  } catch (error) {
    console.error('❌ Failed to get Agora tokens:', error);
    throw new Error(`Failed to get video call credentials: ${error instanceof Error ? error.message : 'Network or authentication error'}`);
  }
}

export async function joinRtc(credentials: AgoraCredentials): Promise<AgoraClient> {
  try {
    console.log('🎥 Initializing Agora RTC client with credentials:', {
      appId: credentials.appId,
      channelName: credentials.channelName,
      uid: credentials.uid
    });

    // Create Agora client
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Join the channel
    console.log('🎥 Joining channel...');
    const uid = await client.join(
      credentials.appId,
      credentials.channelName,
      credentials.token,
      credentials.uid
    );
    
    console.log('✅ Successfully joined channel with UID:', uid);

    // Create local tracks
    console.log('🎥 Creating local audio and video tracks...');
    const [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
      {
        // Audio track config
        encoderConfig: "music_standard",
        AEC: true,
        ANS: true,
        AGC: true
      },
      {
        // Video track config  
        encoderConfig: "720p_1",
        facingMode: "user"
      }
    );

    console.log('✅ Local tracks created successfully');

    // Publish local tracks
    console.log('🎥 Publishing local tracks...');
    await client.publish([localAudioTrack, localVideoTrack]);
    console.log('✅ Local tracks published successfully');

    agoraClient = {
      client,
      localVideoTrack,
      localAudioTrack,
      uid: uid.toString()
    };

    // Handle remote users joining
    client.on("user-published", async (user, mediaType) => {
      console.log('👤 Remote user published:', user.uid, 'mediaType:', mediaType);
      
      try {
        await client.subscribe(user, mediaType);
        console.log('✅ Subscribed to remote user:', user.uid, 'for', mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoElement = document.getElementById('remote-video');
          if (remoteVideoElement && user.videoTrack) {
            user.videoTrack.play(remoteVideoElement);
            console.log('📺 Playing remote video for user:', user.uid);
          } else {
            console.warn('⚠️ Remote video element not found or no video track');
          }
        }
        
        if (mediaType === 'audio' && user.audioTrack) {
          user.audioTrack.play();
          console.log('🔊 Playing remote audio for user:', user.uid);
        }
      } catch (error) {
        console.error('❌ Failed to subscribe to remote user:', user.uid, error);
        // Retry subscription after a short delay
        setTimeout(async () => {
          try {
            await client.subscribe(user, mediaType);
            console.log('🔄 Retry: Successfully subscribed to remote user:', user.uid);
          } catch (retryError) {
            console.error('❌ Retry failed for remote user:', user.uid, retryError);
          }
        }, 1000);
      }
    });

    client.on("user-unpublished", (user, mediaType) => {
      console.log('👤 Remote user unpublished:', user.uid, 'mediaType:', mediaType);
    });

    client.on("user-left", (user) => {
      console.log('👤 Remote user left:', user.uid);
    });

    // Play local video
    const localVideoContainer = document.getElementById('local-video');
    if (localVideoContainer && localVideoTrack) {
      localVideoTrack.play(localVideoContainer);
      console.log('✅ Playing local video');
    }

    return agoraClient;
  } catch (error) {
    console.error('❌ Failed to join RTC:', error);
    throw error;
  }
}

export async function leaveRtc(): Promise<void> {
  try {
    if (!agoraClient) {
      console.log('🎥 No active Agora client to leave');
      return;
    }

    console.log('🎥 Leaving RTC channel...');

    // Stop and close local tracks
    if (agoraClient.localVideoTrack) {
      agoraClient.localVideoTrack.stop();
      agoraClient.localVideoTrack.close();
      console.log('✅ Local video track stopped and closed');
    }

    if (agoraClient.localAudioTrack) {
      agoraClient.localAudioTrack.stop();
      agoraClient.localAudioTrack.close();
      console.log('✅ Local audio track stopped and closed');
    }

    // Leave the channel
    await agoraClient.client.leave();
    console.log('✅ Successfully left RTC channel');

    agoraClient = null;
  } catch (error) {
    console.error('❌ Failed to leave RTC:', error);
    throw error;
  }
}

export async function toggleAudio(muted: boolean): Promise<void> {
  if (agoraClient?.localAudioTrack) {
    await agoraClient.localAudioTrack.setMuted(muted);
    console.log('🎥 Audio', muted ? 'muted' : 'unmuted');
  }
}

export async function toggleVideo(muted: boolean): Promise<void> {
  if (agoraClient?.localVideoTrack) {
    await agoraClient.localVideoTrack.setMuted(muted);
    console.log('🎥 Video', muted ? 'muted' : 'unmuted');
  }
}

export function getAgoraClient(): AgoraClient | null {
  return agoraClient;
}