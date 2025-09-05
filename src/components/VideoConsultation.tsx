import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAgoraTokens, joinRtc, leaveRtc, toggleAudio, toggleVideo, type AgoraCredentials, type AgoraClient } from '@/utils/agora';
import { useCall } from '@/hooks/use-call';

interface VideoConsultationProps {
  consultationId: string;
  isActive?: boolean;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function VideoConsultation({ 
  consultationId, 
  isActive, 
  onEnd, 
  onError 
}: VideoConsultationProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [credentials, setCredentials] = useState<AgoraCredentials | null>(null);
  const [agoraClient, setAgoraClient] = useState<AgoraClient | null>(null);
  
  const { 
    activeCall, 
    initiateCall, 
    endCall, 
    updateParticipantState,
    isInitiating,
    isEnding 
  } = useCall(consultationId);

  // Auto-connect when there's an active call or when isActive is true
  useEffect(() => {
    console.log('🎥 VideoConsultation effect:', { 
      activeCallStatus: activeCall?.status, 
      isConnected, 
      isActive,
      consultationId 
    });
    
    if (activeCall?.status === 'active' && !isConnected) {
      console.log('🎥 Initializing video call for active call');
      initializeVideoCall();
    } else if (!activeCall && isConnected) {
      console.log('🎥 Ending video call - no active call');
      endVideoCall();
    }
  }, [activeCall?.status, isConnected]);

  // Auto-initiate call when isActive becomes true - use dependency array to prevent infinite calls
  useEffect(() => {
    console.log('🎥 VideoConsultation isActive effect:', { 
      isActive, 
      activeCall: !!activeCall, 
      isInitiating,
      consultationId 
    });
    
    if (isActive && !activeCall && !isInitiating && consultationId) {
      console.log('🎥 Auto-initiating call because isActive=true');
      handleStartCall();
    }
  }, [isActive, !!activeCall, isInitiating, consultationId]);

  const initializeVideoCall = async () => {
    try {
      setIsConnecting(true);
      
      if (!activeCall) {
        throw new Error('No active call session');
      }
      
      // Use the channel name from the call session
      const channelName = activeCall.channel_name;
      const uid = `user_${Date.now()}`;
      
      console.log('🎥 Getting Agora tokens for channel:', channelName);
      
      // Get Agora tokens from our edge function
      const agoraCredentials = await getAgoraTokens(channelName, uid);
      setCredentials(agoraCredentials);
      
      console.log('🎥 Joining RTC with credentials:', agoraCredentials);
      
      // Join the RTC channel
      const client = await joinRtc(agoraCredentials);
      setAgoraClient(client);
      
      setIsConnected(true);
      setIsConnecting(false);
      
      toast({
        title: "Video Call Connected",
        description: "You're now connected to the video call.",
      });
      
    } catch (error) {
      console.error('❌ Video call initialization failed:', error);
      setIsConnecting(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start video call';
      onError?.(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const endVideoCall = async () => {
    try {
      if (isConnected && agoraClient) {
        console.log('🎥 Ending video call...');
        await leaveRtc();
        setIsConnected(false);
        setCredentials(null);
        setAgoraClient(null);
        
        toast({
          title: "Video Call Ended",
          description: "You have left the video call.",
        });
      }
    } catch (error) {
      console.error('❌ Error ending video call:', error);
    }
  };

  const handleStartCall = () => {
    console.log('🎥 handleStartCall called:', { consultationId });
    initiateCall({ consultationId, callType: 'video' });
  };

  const handleEndCall = () => {
    if (activeCall) {
      endCall(activeCall.id);
    }
    endVideoCall();
    onEnd?.();
  };

  const handleToggleAudio = async () => {
    try {
      const newMutedState = !isAudioMuted;
      await toggleAudio(newMutedState);
      setIsAudioMuted(newMutedState);
      
      if (activeCall) {
        updateParticipantState({ 
          callId: activeCall.id, 
          isAudioMuted: newMutedState 
        });
      }
      console.log(`🎥 Audio ${newMutedState ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('❌ Failed to toggle audio:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      const newMutedState = !isVideoMuted;
      await toggleVideo(newMutedState);
      setIsVideoMuted(newMutedState);
      
      if (activeCall) {
        updateParticipantState({ 
          callId: activeCall.id, 
          isVideoMuted: newMutedState 
        });
      }
      console.log(`🎥 Video ${newMutedState ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('❌ Failed to toggle video:', error);
    }
  };

  // Show call interface if there's an active call or if explicitly set to active
  const shouldShowCall = activeCall?.status === 'active' || isActive;
  
  if (!shouldShowCall && !activeCall) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">
            <Button
              onClick={handleStartCall}
              disabled={isInitiating}
              className="flex items-center gap-2"
            >
              {isInitiating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Phone className="w-4 h-4" />
              )}
              {isInitiating ? 'Starting Call...' : 'Start Video Call'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shouldShowCall) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
                <p className="text-muted-foreground">
                  Setting up your video call
                </p>
              </div>
            </div>
          )}
          
          {/* Video containers for local and remote video */}
          <div className="relative w-full h-full">
            {/* Remote video (main view) */}
            <div 
              id="remote-video" 
              className="w-full h-full bg-gray-900 rounded-lg"
            >
              {!isConnecting && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-16 h-16 mx-auto mb-4" />
                    <p>Waiting for other participant...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Local video (picture-in-picture) */}
            <div 
              id="local-video" 
              className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-white shadow-lg"
            >
              {!isConnecting && (
                <div className="w-full h-full flex items-center justify-center text-white text-xs">
                  You
                </div>
              )}
            </div>
          </div>
          
          {/* Video Controls */}
          {(isConnected || isConnecting) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 rounded-lg p-2">
              <Button
                variant={isAudioMuted ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleAudio}
                disabled={isConnecting}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={isVideoMuted ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleVideo}
                disabled={isConnecting}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndCall}
                disabled={isConnecting || isEnding}
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Connection info */}
          {isConnected && credentials && (
            <div className="absolute top-4 left-4 bg-background/80 rounded px-2 py-1 text-xs text-muted-foreground">
              Channel: {credentials.channelName}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}