"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX, 
  Users, 
  MessageSquare, 
  Settings, 
  Monitor,
  Bot,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LiveMeetingViewProps {
  meeting: {
    id: string;
    title: string;
    description: string;
    aiAgentId: string;
    aiAgentName: string;
    duration: number;
  };
  onEndMeeting: () => void;
}

interface MediaState {
  audio: boolean;
  video: boolean;
  volume: number;
  isMuted: boolean;
}

interface AIAgentState {
  isConnected: boolean;
  isSpeaking: boolean;
  callDuration: number;
  lastMessage: string;
}

export const LiveMeetingView = ({ meeting, onEndMeeting }: LiveMeetingViewProps) => {
  const { toast } = useToast();
  const [mediaState, setMediaState] = useState<MediaState>({
    audio: true,
    video: true,
    volume: 100,
    isMuted: false,
  });
  
  const [aiAgentState, setAiAgentState] = useState<AIAgentState>({
    isConnected: false,
    isSpeaking: false,
    callDuration: 0,
    lastMessage: '',
  });
  
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userIsSpeaking, setUserIsSpeaking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const meetingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vapiClientRef = useRef<any>(null);

  // Initialize VAPI client
  useEffect(() => {
    const initializeVapi = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Initializing VAPI client...');
        
        // Try to load VAPI client with better error handling
        const vapiModule = await import('@/lib/vapi/vapiClient');
        const vapiInstance = vapiModule.vapi || vapiModule.default;
        
        if (!vapiInstance) {
          throw new Error('VAPI client not found in module');
        }
        
        vapiClientRef.current = vapiInstance;
        
        console.log('✅ VAPI client loaded:', {
          isDemoMode: vapiModule.isDemoMode?.() || false,
          hasVapiInstance: !!vapiInstance,
          timestamp: new Date().toISOString()
        });
        
        // Setup VAPI event listeners
        vapiInstance.on('call-start', handleAICallStart);
        vapiInstance.on('call-end', handleAICallEnd);
        vapiInstance.on('speech-start', handleAISpeechStart);
        vapiInstance.on('speech-end', handleAISpeechEnd);
        vapiInstance.on('error', handleAIError);
        
        toast({
          title: "Meeting Initialized",
          description: vapiModule.isDemoMode?.() ? "AI agent ready (Demo mode)" : "AI agent is ready to connect",
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to initialize VAPI:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          timestamp: new Date().toISOString()
        });
        
        // Create a fallback demo client
        const fallbackClient = {
          start: async (assistantId: string) => {
            console.log('🎭 Fallback Demo: Starting call with', assistantId);
            setTimeout(() => handleAICallStart(), 1000);
            return { success: true };
          },
          stop: () => {
            console.log('🎭 Fallback Demo: Stopping call');
            handleAICallEnd();
            return { success: true };
          },
          on: (event: string, callback: Function) => {
            console.log('🎭 Fallback Demo: Registering event listener for:', event);
          },
          off: () => {}
        };
        
        vapiClientRef.current = fallbackClient;
        
        toast({
          title: "Demo Mode Active",
          description: "Using fallback demo mode for AI agent",
          variant: "default",
        });
        
        setIsLoading(false);
      }
    };

    initializeVapi();
    return () => {
      if (vapiClientRef.current) {
        vapiClientRef.current.off('call-start', handleAICallStart);
        vapiClientRef.current.off('call-end', handleAICallEnd);
        vapiClientRef.current.off('speech-start', handleAISpeechStart);
        vapiClientRef.current.off('speech-end', handleAISpeechEnd);
        vapiClientRef.current.off('error', handleAIError);
      }
    };
  }, []);

  // Auto-connect AI agent when meeting starts and agent is configured
  useEffect(() => {
    if (meeting.aiAgentId && vapiClientRef.current && !aiAgentState.isConnected && !isLoading) {
      console.log('🚀 Auto-connecting AI agent to meeting:', {
        meetingId: meeting.id,
        aiAgentId: meeting.aiAgentId,
        aiAgentName: meeting.aiAgentName,
        timestamp: new Date().toISOString()
      });
      
      // Auto-connect after a short delay to ensure everything is ready
      const autoConnectTimer = setTimeout(() => {
        connectAIAgent();
      }, 2000);

      return () => {
        if (autoConnectTimer) {
          clearTimeout(autoConnectTimer);
        }
      };
    }
  }, [meeting.aiAgentId, vapiClientRef.current, aiAgentState.isConnected, isLoading]);

  // Start meeting timer
  useEffect(() => {
    meetingTimerRef.current = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);

    return () => {
      if (meetingTimerRef.current) {
        clearInterval(meetingTimerRef.current);
      }
    };
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timer);
      setTimeout(() => setShowControls(false), 5000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // AI Agent event handlers
  const handleAICallStart = () => {
    setAiAgentState(prev => ({ ...prev, isConnected: true, callDuration: 0 }));
    callTimerRef.current = setInterval(() => {
      setAiAgentState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
    toast({
      title: "AI Agent Connected",
      description: `${meeting.aiAgentName} has joined the meeting`,
    });
  };

  const handleAICallEnd = () => {
    setAiAgentState(prev => ({ 
      ...prev, 
      isConnected: false, 
      isSpeaking: false, 
      callDuration: 0 
    }));
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    toast({
      title: "AI Agent Disconnected",
      description: `${meeting.aiAgentName} has left the meeting`,
    });
  };

  const handleAISpeechStart = () => {
    setAiAgentState(prev => ({ ...prev, isSpeaking: true }));
  };

  const handleAISpeechEnd = () => {
    setAiAgentState(prev => ({ ...prev, isSpeaking: false }));
  };

  const handleAIError = (error: any) => {
    console.error('AI Agent error:', error);
    toast({
      title: "AI Agent Error",
      description: "There was an issue with the AI agent connection",
      variant: "destructive",
    });
  };

  // Initialize user media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Setup audio analysis for speech detection
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        // Monitor audio levels
        const checkAudioLevel = () => {
          if (!analyserRef.current) return;
          
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedVolume = average / 256;

          if (normalizedVolume > 0.15 && !mediaState.isMuted && !aiAgentState.isSpeaking) {
            setUserIsSpeaking(true);
            setTimeout(() => setUserIsSpeaking(false), 500);
          }

          requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
      } catch (error) {
        console.error('Failed to initialize media:', error);
        toast({
          title: "Media Access Failed",
          description: "Could not access camera and microphone",
          variant: "destructive",
        });
      }
    };

    initializeMedia();
  }, [mediaState.isMuted, aiAgentState.isSpeaking]);

  // Connect AI Agent
  const connectAIAgent = async () => {
    if (!vapiClientRef.current || !meeting.aiAgentId) {
      console.log('⚠️ Cannot connect AI agent:', {
        hasVapiClient: !!vapiClientRef.current,
        hasAiAgentId: !!meeting.aiAgentId,
        aiAgentId: meeting.aiAgentId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    try {
      console.log('🤖 Connecting AI agent:', {
        aiAgentId: meeting.aiAgentId,
        timestamp: new Date().toISOString()
      });
      
      await vapiClientRef.current.start(meeting.aiAgentId);
      
      console.log('✅ AI agent connected successfully');
      toast({
        title: "AI Agent Connected",
        description: `${meeting.aiAgentName} has joined the meeting`,
      });
    } catch (error) {
      console.error('🔴 Failed to connect AI agent:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        aiAgentId: meeting.aiAgentId,
        timestamp: new Date().toISOString()
      });
      
      handleAIError(error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to AI agent",
        variant: "destructive",
      });
    }
  };

  // Disconnect AI Agent
  const disconnectAIAgent = () => {
    if (!vapiClientRef.current) return;
    
    try {
      vapiClientRef.current.stop();
    } catch (error) {
      console.error('Failed to disconnect AI agent:', error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setMediaState(prev => ({ ...prev, audio: !prev.audio, isMuted: !prev.audio }));
    toast({
      description: mediaState.audio ? "Microphone muted" : "Microphone unmuted",
    });
  };

  // Toggle video
  const toggleVideo = () => {
    setMediaState(prev => ({ ...prev, video: !prev.video }));
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !mediaState.video;
      });
    }
    toast({
      description: mediaState.video ? "Camera turned off" : "Camera turned on",
    });
  };

  // End meeting
  const handleEndMeeting = () => {
    if (aiAgentState.isConnected) {
      disconnectAIAgent();
    }
    
    // Stop all media tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Clean up timers
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (meetingTimerRef.current) clearInterval(meetingTimerRef.current);
    
    toast({
      title: "Meeting Ended",
      description: "The meeting has been successfully ended",
    });
    
    onEndMeeting();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Initializing Meeting</h2>
          <p className="text-gray-300">Setting up your meeting environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">LIVE MEETING</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{meeting.title}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(meetingDuration)}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <Users className="w-4 h-4" />
              <span>{aiAgentState.isConnected ? 2 : 1} participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={cn(
          "flex-1 relative",
          showChat ? "w-3/4" : "w-full"
        )}>
          {/* User Video (Main) */}
          <div className={cn(
            "absolute inset-0 transition-all duration-300",
            aiAgentState.isConnected ? "h-2/3" : "h-full"
          )}>
            <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  !mediaState.video && "hidden"
                )}
              />
              {!mediaState.video && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-70">Camera is off</p>
                  </div>
                </div>
              )}
              
              {/* User Speaking Indicator */}
              {userIsSpeaking && (
                <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-pulse" />
              )}
              
              {/* User Info Overlay */}
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                You {mediaState.isMuted && <MicOff className="w-3 h-3 inline ml-1" />}
              </div>
            </div>
          </div>

          {/* AI Agent Video */}
          {aiAgentState.isConnected && (
            <div className="absolute bottom-0 left-0 right-0 h-1/3 border-t border-gray-600">
              <div className="relative w-full h-full bg-gradient-to-br from-blue-900 to-indigo-900 rounded-lg overflow-hidden">
                {/* AI Agent Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={cn(
                    "w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-300",
                    aiAgentState.isSpeaking && "scale-110 bg-blue-400"
                  )}>
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                {/* AI Speaking Indicator */}
                {aiAgentState.isSpeaking && (
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-lg animate-pulse" />
                )}
                
                {/* AI Agent Info */}
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                  <Bot className="w-3 h-3" />
                  <span>{meeting.aiAgentName}</span>
                  <span className="text-green-400">
                    {formatTime(aiAgentState.callDuration)}
                  </span>
                </div>
                
                {/* Connection Status */}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    Connected
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-1/4 bg-gray-900 border-l border-gray-600 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <h3 className="text-white font-medium">Meeting Chat</h3>
              <p className="text-gray-400 text-sm">
                Chat with {meeting.aiAgentName}
              </p>
            </div>
            <div className="flex-1 p-4 text-white">
              <div className="text-center text-gray-400 mt-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chat messages will appear here</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Control */}
          <Button
            onClick={toggleAudio}
            size="lg"
            variant={mediaState.audio ? "secondary" : "destructive"}
            className="rounded-full w-12 h-12 p-0"
          >
            {mediaState.audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          {/* Video Control */}
          <Button
            onClick={toggleVideo}
            size="lg"
            variant={mediaState.video ? "secondary" : "destructive"}
            className="rounded-full w-12 h-12 p-0"
          >
            {mediaState.video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          {/* AI Agent Control */}
          <Button
            onClick={aiAgentState.isConnected ? disconnectAIAgent : connectAIAgent}
            size="lg"
            variant={aiAgentState.isConnected ? "default" : "outline"}
            className="rounded-full w-12 h-12 p-0"
          >
            <Bot className="w-5 h-5" />
          </Button>

          {/* Chat Toggle */}
          <Button
            onClick={() => setShowChat(!showChat)}
            size="lg"
            variant={showChat ? "default" : "outline"}
            className="rounded-full w-12 h-12 p-0"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* End Call */}
          <Button
            onClick={handleEndMeeting}
            size="lg"
            variant="destructive"
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 