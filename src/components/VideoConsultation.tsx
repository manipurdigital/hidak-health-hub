import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Loader2, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAgoraTokens, joinRtc, leaveRtc, type AgoraCredentials } from '@/utils/agora';
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
    console.debug('VideoConsultation effect:', { 
      activeCallStatus: activeCall?.status, 
      isConnected, 
      isActive,
      consultationId 
    });
    
    if (activeCall?.status === 'active' && !isConnected) {
      initializeVideoCall();
    } else if (!activeCall && isConnected) {
      endVideoCall();
    }
  }, [activeCall?.status, isConnected]);

  // Auto-initiate call when isActive becomes true
  useEffect(() => {
    if (isActive && !activeCall && !isInitiating) {
      console.debug('Auto-initiating call because isActive=true');
      handleStartCall();
    }
  }, [isActive, activeCall, isInitiating]);

  const initializeVideoCall = async () => {
    try {
      setIsConnecting(true);
      
      if (!activeCall) {
        throw new Error('No active call session');
      }
      
      // Use the channel name from the call session
      const channelName = activeCall.channel_name;
      const uid = `user_${Date.now()}`;
      
      console.log('Getting Agora tokens for channel:', channelName);
      
      // Get Agora tokens from our edge function
      const agoraCredentials = await getAgoraTokens(channelName, uid);
      setCredentials(agoraCredentials);
      
      console.log('Joining RTC with credentials:', agoraCredentials);
      
      // Join the RTC channel
      await joinRtc(agoraCredentials);
      
      setIsConnected(true);
      setIsConnecting(false);
      
      toast({
        title: "Video Call Connected",
        description: "You're now connected to the video call.",
      });
      
    } catch (error) {
      console.error('Video call initialization failed:', error);
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
      if (isConnected) {
        await leaveRtc();
        setIsConnected(false);
        setCredentials(null);
        
        toast({
          title: "Video Call Ended",
          description: "You have left the video call.",
        });
      }
    } catch (error) {
      console.error('Error ending video call:', error);
    }
  };

  const handleStartCall = () => {
    initiateCall({ consultationId, callType: 'video' });
  };

  const handleEndCall = () => {
    if (activeCall) {
      endCall(activeCall.id);
    }
    endVideoCall();
    onEnd?.();
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    if (activeCall) {
      updateParticipantState({ 
        callId: activeCall.id, 
        isAudioMuted: !isAudioMuted 
      });
    }
    console.log(`Audio ${!isAudioMuted ? 'muted' : 'unmuted'}`);
  };

  const toggleVideo = () => {
    setIsVideoMuted(!isVideoMuted);
    if (activeCall) {
      updateParticipantState({ 
        callId: activeCall.id, 
        isVideoMuted: !isVideoMuted 
      });
    }
    console.log(`Video ${!isVideoMuted ? 'muted' : 'unmuted'}`);
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
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
          {isConnecting && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
              <p className="text-muted-foreground">
                Setting up your video call
              </p>
            </div>
          )}
          
          {isConnected && !isConnecting && (
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Video Call Active</h3>
              <p className="text-muted-foreground">
                Connected to consultation room
              </p>
              {credentials && (
                <p className="text-xs text-muted-foreground mt-2">
                  Channel: {credentials.channelName}
                </p>
              )}
            </div>
          )}
          
          {/* Video Controls */}
          {(isConnected || isConnecting) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <Button
                variant={isAudioMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleAudio}
                disabled={isConnecting}
              >
                {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={isVideoMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleVideo}
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
        </div>
      </CardContent>
    </Card>
  );
}