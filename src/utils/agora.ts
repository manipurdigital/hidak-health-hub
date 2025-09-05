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
  try {
    console.log('🎥 Getting Agora tokens for channel:', channelName, 'uid:', uid);
    
    console.log('🎥 Calling supabase.functions.invoke with agora-tokens...');
    const response = await supabase.functions.invoke('agora-tokens', {
      body: {
        channelName,
        uid,
        role: 'publisher'
      }
    });
    
    console.log('🎥 Edge function response:', response);
    const { data, error } = response;

    if (error) {
      console.error('❌ Error getting Agora tokens:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to get video call credentials: ${error.message || 'Unknown error'}`);
    }
    
    if (!data) {
      console.error('❌ No data received from agora-tokens function');
      throw new Error('No data received from video call service');
    }

    console.log('✅ Successfully got Agora credentials:', { 
      appId: data.appId, 
      channelName: data.channelName,
      uid: data.uid,
      hasToken: !!data.token
    });

    return data;
  } catch (error) {
    console.error('❌ Agora token generation failed:', error);
    throw error;
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
      
      // Subscribe to remote user
      await client.subscribe(user, mediaType);
      console.log('✅ Subscribed to remote user:', user.uid);

      if (mediaType === "video") {
        const remoteVideoTrack = user.videoTrack;
        if (remoteVideoTrack) {
          // Find remote video container and play
          const remoteVideoContainer = document.getElementById('remote-video');
          if (remoteVideoContainer) {
            remoteVideoTrack.play(remoteVideoContainer);
            console.log('✅ Playing remote video for user:', user.uid);
          }
        }
      }

      if (mediaType === "audio") {
        const remoteAudioTrack = user.audioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          console.log('✅ Playing remote audio for user:', user.uid);
        }
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