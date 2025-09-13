import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, PhoneOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getZegoToken } from '@/utils/zego';
import { useCall } from '@/hooks/use-call';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate } from '@/components/PermissionGate';

interface VideoConsultationEnhancedProps {
  consultationId: string;
  isActive?: boolean;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function VideoConsultationEnhanced({
  consultationId,
  isActive = false,
  onEnd,
  onError
}: VideoConsultationEnhancedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeCall, initiateCall, endCall, isInitiating, isEnding } = useCall(consultationId);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [zegoCredentials, setZegoCredentials] = useState<any>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const zegoInstanceRef = useRef<any>(null);
  const initializationRef = useRef<boolean>(false);

  console.log('🎥 VideoConsultationEnhanced render:', { 
    consultationId, 
    isActive, 
    hasActiveCall: !!activeCall,
    callStatus: activeCall?.status,
    isConnecting,
    isConnected
  });

  // Enhanced ZegoCloud initialization with better error handling
  const initializeVideoCall = useCallback(async () => {
    if (!user?.id || !activeCall || !videoContainerRef.current || initializationRef.current) {
      console.log('🚫 Skipping video call initialization:', {
        hasUser: !!user?.id,
        hasActiveCall: !!activeCall,
        hasContainer: !!videoContainerRef.current,
        isInitializing: initializationRef.current
      });
      return;
    }

    console.log('🎬 Initializing video call for:', activeCall.id);
    initializationRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Generate room ID based on call session
      const roomId = activeCall.channel_name;
      const userId = user.id.slice(0, 8); // ZegoCloud requires shorter user IDs

      console.log('🔐 Getting Zego token for room:', roomId, 'user:', userId);
      
      // Get Zego token with retry logic
      let credentials;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          credentials = await getZegoToken(roomId, userId);
          break;
        } catch (error) {
          retryCount++;
          console.warn(`🔄 Zego token attempt ${retryCount} failed:`, error);
          if (retryCount === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      setZegoCredentials(credentials);
      console.log('✅ Got Zego credentials:', { 
        appId: credentials.appId, 
        roomId: credentials.roomId,
        userId: credentials.userId
      });

      // Request media permissions first
      console.log('🎥 Requesting camera and microphone permissions...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Close the stream immediately after permission check
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Media permissions granted');
      } catch (permissionError) {
        console.error('❌ Media permissions denied:', permissionError);
        throw new Error('Camera and microphone access required for video calls');
      }

      // Create ZegoCloud instance with appId and server secret
      console.log('🔗 Creating ZegoCloud instance...');
      const zego = ZegoUIKitPrebuilt.create(
        credentials.appId,
        credentials.token
      );
      
      // Enhanced join configuration
      const joinConfig = {
        container: videoContainerRef.current,
        sharedLinks: [{
          name: 'Personal link',
          url: window.location.href,
        }],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        showPreJoinView: false,
        showLeavingView: false,
        showLayoutButton: false,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        showPinButton: false,
        showRemoveUserButton: false,
        maxUsers: 2,
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        onJoinRoom: () => {
          console.log('✅ Successfully joined Zego room');
          setIsConnected(true);
          setIsConnecting(false);
        },
        onLeaveRoom: () => {
          console.log('👋 Left Zego room');
          setIsConnected(false);
          setIsConnecting(false);
          onEnd?.();
        },
        onUserJoin: (users: any[]) => {
          console.log('👥 Users joined:', users.length);
        },
        onUserLeave: (users: any[]) => {
          console.log('👋 Users left:', users.length);
        },
        onError: (error: any) => {
          console.error('❌ ZegoCloud error:', error);
          setConnectionError(`ZegoCloud error: ${error.message || 'Unknown error'}`);
          setIsConnecting(false);
        }
      };

      console.log('🔗 Joining Zego room with config:', joinConfig);
      
      // Join the room
      await zego.joinRoom(joinConfig);
      zegoInstanceRef.current = zego;
      
      console.log('✅ Video call initialized successfully');

    } catch (error: any) {
      console.error('❌ Failed to initialize video call:', error);
      setConnectionError(error.message || 'Failed to connect to video call');
      setIsConnecting(false);
      onError?.(error.message || 'Failed to connect to video call');
      
      toast({
        title: "Video Call Error",
        description: error.message || 'Failed to connect to video call',
        variant: "destructive",
      });
    } finally {
      initializationRef.current = false;
    }
  }, [user?.id, activeCall, onEnd, onError, toast]);

  // Enhanced cleanup function
  const endVideoCall = useCallback(() => {
    console.log('🧹 Ending video call and cleaning up');
    
    try {
      if (zegoInstanceRef.current) {
        console.log('🚪 Leaving Zego room');
        zegoInstanceRef.current.destroy();
        zegoInstanceRef.current = null;
      }
    } catch (error) {
      console.error('❌ Error during Zego cleanup:', error);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    setZegoCredentials(null);
    initializationRef.current = false;
  }, []);

  // Auto-initialize when call becomes active
  useEffect(() => {
    if (activeCall?.status === 'active' && isActive) {
      console.log('🚀 Auto-initializing video call for active call');
      initializeVideoCall();
    } else if (!activeCall || activeCall.status !== 'active') {
      console.log('🛑 Cleaning up video call - no active call');
      endVideoCall();
    }

    return () => {
      if (!activeCall || activeCall.status === 'ended') {
        endVideoCall();
      }
    };
  }, [activeCall, isActive, initializeVideoCall, endVideoCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up video call');
      endVideoCall();
    };
  }, [endVideoCall]);

  // Handle start call with debouncing
  const handleStartCall = useCallback(async () => {
    if (isInitiating) return;
    
    try {
      console.log('🎬 Starting video call for consultation:', consultationId);
      await initiateCall({ consultationId, callType: 'video' });
    } catch (error: any) {
      console.error('❌ Failed to start call:', error);
      toast({
        title: "Failed to Start Call",
        description: error.message || 'Unable to initiate video call',
        variant: "destructive",
      });
    }
  }, [consultationId, initiateCall, isInitiating, toast]);

  // Handle end call
  const handleEndCall = useCallback(async () => {
    if (!activeCall || isEnding) return;
    
    try {
      console.log('🛑 Ending video call:', activeCall.id);
      endVideoCall(); // Clean up Zego first
      await endCall(activeCall.id);
    } catch (error: any) {
      console.error('❌ Failed to end call:', error);
      toast({
        title: "Error Ending Call",
        description: error.message || 'Failed to end the call',
        variant: "destructive",
      });
    }
  }, [activeCall, endCall, endVideoCall, isEnding, toast]);

  // Show permission gate if permissions not granted
  if (!permissionsGranted) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="w-12 h-12 text-primary" />
            <h3 className="text-lg font-semibold">Camera & Microphone Access Required</h3>
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                To start your video consultation, please allow access to:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="text-sm font-medium text-blue-900 mb-2">Required for Video Consultation:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>📹 <strong>Camera access</strong> - to see each other during consultation</li>
                  <li>🎤 <strong>Microphone access</strong> - to communicate clearly with your doctor</li>
                  <li>🔔 <strong>Sound notifications</strong> - to hear incoming calls with audio alerts</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Your browser will ask for permission. Please click "Allow" when prompted.
                </p>
              </div>
            </div>
            <PermissionGate
              onPermissionsGranted={() => setPermissionsGranted(true)}
              requiredPermissions={['camera', 'microphone']}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render different states
  if (!activeCall || activeCall.status === 'ended') {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold">Video Consultation</h3>
            <p className="text-muted-foreground text-center">
              Start a video call to begin your consultation
            </p>
            <Button 
              onClick={handleStartCall}
              disabled={isInitiating}
              className="w-full max-w-xs"
            >
              {isInitiating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Call...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Video Call
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Video Consultation</h3>
            {activeCall.status === 'active' && (
              <Button
                onClick={handleEndCall}
                disabled={isEnding}
                variant="destructive"
                size="sm"
              >
                {isEnding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ending...
                  </>
                ) : (
                  <>
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Call
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Connection Status */}
          {isConnecting && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Connecting to video call...</span>
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{connectionError}</p>
              <Button 
                onClick={initializeVideoCall}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry Connection
              </Button>
            </div>
          )}

          {/* Video Container */}
          <div 
            ref={videoContainerRef}
            className={`relative w-full bg-muted rounded-lg ${
              activeCall.status === 'active' ? 'h-96' : 'h-48'
            }`}
            style={{ minHeight: '300px' }}
          >
            {!isConnected && !isConnecting && !connectionError && activeCall.status === 'active' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground">Preparing video call...</p>
              </div>
            )}
          </div>

          {/* Call Status */}
          <div className="text-center text-sm text-muted-foreground">
            Status: {activeCall.status} {isConnected && '• Connected'}
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && zegoCredentials && (
            <details className="text-xs text-muted-foreground">
              <summary>Debug Info</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {JSON.stringify({
                  callId: activeCall.id,
                  roomId: zegoCredentials.roomId,
                  userId: zegoCredentials.userId,
                  isConnected,
                  isConnecting
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}