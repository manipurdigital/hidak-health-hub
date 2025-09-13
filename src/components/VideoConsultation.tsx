import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getZegoToken, ZegoCredentials } from '@/utils/zego';
import { useCall } from '@/hooks/use-call';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

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
  const [credentials, setCredentials] = useState<ZegoCredentials | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const zegoCloudInstance = useRef<any>(null);
  
  const { 
    activeCall, 
    initiateCall, 
    endCall, 
    isInitiating,
    isEnding 
  } = useCall(consultationId);

  // Get user data
  const { data: authData } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data;
    }
  });
  
  const user = authData?.user;

  // Auto-connect when there's an active call
  useEffect(() => {
    if (activeCall?.status === 'active' && !isConnected) {
      console.log('🎥 Initializing video call for active call');
      initializeVideoCall();
    } else if (!activeCall && isConnected) {
      console.log('🎥 Ending video call - no active call');
      endVideoCall();
    }
  }, [activeCall?.status, isConnected]);

  // Auto-initiate call when isActive becomes true (only once)
  useEffect(() => {
    if (isActive && !activeCall && !isInitiating && consultationId) {
      console.log('🎥 Auto-initiating call because isActive=true');
      handleStartCall();
    }
  }, [isActive, consultationId]); // Only depend on isActive and consultationId

  const initializeVideoCall = async () => {
    if (!consultationId || !activeCall?.channel_name || !user?.id) {
      console.error('❌ Missing consultation ID, channel name, or user ID');
      toast({
        title: "Setup Error",
        description: "Missing required information for video call",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsConnecting(true);
      console.log('🔄 Initializing Zego video call for consultation:', consultationId);
      
      const userId = user.id.slice(0, 8);
      const roomId = activeCall.channel_name;
      
      console.log('📞 Getting Zego credentials...');
      const zegoCredentials = await getZegoToken(roomId, userId);
      console.log('✅ Got Zego credentials:', zegoCredentials);
      setCredentials(zegoCredentials);
      
      toast({
        title: "Connecting",
        description: "Joining video call...",
      });
      
      if (videoContainerRef.current) {
        console.log('🔗 Initializing Zego UI Kit...');
        
        const zp = ZegoUIKitPrebuilt.create(zegoCredentials.token);
        zegoCloudInstance.current = zp;
        
        // Configure the video call
        zp.joinRoom({
          container: videoContainerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },
          showPreJoinView: false,
          showLeaveRoomConfirmDialog: false,
          onJoinRoom: () => {
            console.log('✅ Joined Zego room successfully');
            setIsConnected(true);
            toast({
              title: "Connected",
              description: "Video call is ready",
            });
          },
          onLeaveRoom: () => {
            console.log('🎥 Left Zego room');
            setIsConnected(false);
            onEnd?.();
          },
          onUserJoin: (users: any[]) => {
            console.log('👥 Users joined:', users);
          },
          onUserLeave: (users: any[]) => {
            console.log('👋 Users left:', users);
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize video call:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to initialize video call',
        variant: "destructive"
      });
      onError?.(error instanceof Error ? error.message : 'Failed to initialize video call');
    } finally {
      setIsConnecting(false);
    }
  };

  const endVideoCall = async () => {
    try {
      if (zegoCloudInstance.current) {
        console.log('🎥 Ending Zego video call...');
        zegoCloudInstance.current.destroy();
        zegoCloudInstance.current = null;
      }
      setIsConnected(false);
      setCredentials(null);
      
      toast({
        title: "Video Call Ended",
        description: "You have left the video call.",
      });
    } catch (error) {
      console.error('❌ Error ending video call:', error);
    }
  };

  const handleStartCall = async () => {
    if (!consultationId) {
      console.error('❌ No consultation ID provided');
      toast({
        title: "Error",
        description: "No consultation ID provided",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Starting call for consultation:', consultationId);
      initiateCall({ consultationId });
      console.log('✅ Call initiated successfully');
      toast({
        title: "Call Started",
        description: "Video call has been initiated",
      });
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      toast({
        title: "Failed to Start Call",
        description: error instanceof Error ? error.message : 'Failed to start call',
        variant: "destructive"
      });
      onError?.(error instanceof Error ? error.message : 'Failed to start call');
    }
  };

  const handleEndCall = () => {
    if (activeCall) {
      endCall(activeCall.id);
    }
    endVideoCall();
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
                  Setting up your video call with Zego Cloud
                </p>
              </div>
            </div>
          )}
          
          {/* Zego Cloud Video Container */}
          <div 
            ref={videoContainerRef}
            className="w-full h-full rounded-lg"
            style={{ minHeight: '400px' }}
          />
          
          {/* Connection info */}
          {isConnected && credentials && (
            <div className="absolute top-4 left-4 bg-background/80 rounded px-2 py-1 text-xs text-muted-foreground">
              Room: {credentials.roomId}
            </div>
          )}
          
          {/* Manual end call button */}
          {isConnected && (
            <div className="absolute top-4 right-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndCall}
                disabled={isEnding}
              >
                End Call
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}