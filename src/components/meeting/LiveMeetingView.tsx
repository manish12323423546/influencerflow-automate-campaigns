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
  // Only log once when component mounts
  const hasLoggedInit = useRef(false);
  if (!hasLoggedInit.current) {
    console.log('🏁 LiveMeetingView Component Initialized:', {
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      aiAgentId: meeting.aiAgentId,
      aiAgentName: meeting.aiAgentName,
      duration: meeting.duration,
      timestamp: new Date().toISOString(),
      component: 'LiveMeetingView'
    });
    hasLoggedInit.current = true;
  }

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
  
  // Single ref object for all refs to prevent recreating
  const refs = useRef({
    video: null as HTMLVideoElement | null,
    audioContext: null as AudioContext | null,
    analyser: null as AnalyserNode | null,
    callTimer: null as NodeJS.Timeout | null,
    meetingTimer: null as NodeJS.Timeout | null,
    vapiClient: null as any,
    audioStream: null as MediaStream | null,
    userSpeakingTimeout: null as NodeJS.Timeout | null,
    controlsTimeout: null as NodeJS.Timeout | null,
    initialized: false
  });

  // Cleanup function
  const cleanup = () => {
    console.log('🧹 Cleaning up LiveMeetingView resources...');
    
    if (refs.current.callTimer) {
      clearInterval(refs.current.callTimer);
      refs.current.callTimer = null;
    }
    
    if (refs.current.meetingTimer) {
      clearInterval(refs.current.meetingTimer);
      refs.current.meetingTimer = null;
    }
    
    if (refs.current.userSpeakingTimeout) {
      clearTimeout(refs.current.userSpeakingTimeout);
      refs.current.userSpeakingTimeout = null;
    }
    
    if (refs.current.controlsTimeout) {
      clearTimeout(refs.current.controlsTimeout);
      refs.current.controlsTimeout = null;
    }
    
    if (refs.current.audioStream) {
      refs.current.audioStream.getTracks().forEach(track => track.stop());
      refs.current.audioStream = null;
    }
    
    if (refs.current.audioContext && refs.current.audioContext.state !== 'closed') {
      refs.current.audioContext.close();
      refs.current.audioContext = null;
    }
    
    if (refs.current.vapiClient) {
      try {
        refs.current.vapiClient.stop();
      } catch (error) {
        console.error('Error stopping VAPI client:', error);
      }
    }
  };

  // Initialize everything once
  useEffect(() => {
    if (refs.current.initialized) return;
    refs.current.initialized = true;

    const initializeComponent = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Initializing VAPI client...');
        
        // Load VAPI client
        const vapiModule = await import('@/lib/vapi/vapiClient');
        const vapiInstance = vapiModule.vapi || vapiModule.default;
        
        if (!vapiInstance) {
          throw new Error('VAPI client not found in module');
        }
        
        refs.current.vapiClient = vapiInstance;
        
        console.log('✅ VAPI client loaded:', {
          isDemoMode: vapiModule.isDemoMode?.() || false,
          hasVapiInstance: !!vapiInstance,
          timestamp: new Date().toISOString()
        });
        
        // Start meeting timer
        console.log('⏰ Starting Meeting Timer');
        refs.current.meetingTimer = setInterval(() => {
          setMeetingDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration % 30 === 0) {
              console.log('⏱️ Meeting Duration Update:', {
                duration: newDuration,
                formattedTime: formatTime(newDuration),
                timestamp: new Date().toISOString()
              });
            }
            return newDuration;
          });
        }, 1000);
        
        // Initialize user media
        await initializeMedia();
        
        // Setup VAPI event listeners
        setupVAPIListeners();
        
        // Auto-connect AI agent after everything is ready
        if (meeting.aiAgentId) {
          console.log('🚀 Auto-connecting AI agent...');
          setTimeout(() => connectAIAgent(), 2000);
        }
        
        toast({
          title: "Meeting Initialized",
          description: vapiModule.isDemoMode?.() ? "AI agent ready (Demo mode)" : "AI agent is ready to connect",
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to initialize meeting:', error);
        setIsLoading(false);
        
        toast({
          title: "Initialization Failed",
          description: "Could not initialize meeting properly",
          variant: "destructive",
        });
      }
    };

    initializeComponent();

    // Cleanup on unmount
    return cleanup;
  }, []); // Empty dependency array - only run once

  // Setup VAPI event listeners
  const setupVAPIListeners = () => {
    if (!refs.current.vapiClient) return;

    const onCallStart = () => {
      console.log('🤖 AI AGENT JOINED MEETING');
      setAiAgentState(prev => ({ ...prev, isConnected: true, callDuration: 0 }));
      
      refs.current.callTimer = setInterval(() => {
        setAiAgentState(prev => {
          const newDuration = prev.callDuration + 1;
          if (newDuration % 30 === 0) {
            console.log('⏱️ AI Agent Call Duration:', newDuration);
          }
          return { ...prev, callDuration: newDuration };
        });
      }, 1000);
      
      toast({
        title: "AI Agent Connected",
        description: `${meeting.aiAgentName} has joined the meeting`,
      });
    };

    const onCallEnd = () => {
      console.log('🔌 AI AGENT LEFT MEETING');
      setAiAgentState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isSpeaking: false, 
        callDuration: 0 
      }));
      
      if (refs.current.callTimer) {
        clearInterval(refs.current.callTimer);
        refs.current.callTimer = null;
      }
      
      toast({
        title: "AI Agent Disconnected",
        description: `${meeting.aiAgentName} has left the meeting`,
      });
    };

    const onSpeechStart = () => {
      console.log('🗣️ AI AGENT STARTED SPEAKING');
      setAiAgentState(prev => ({ ...prev, isSpeaking: true }));
    };

    const onSpeechEnd = () => {
      console.log('🤐 AI AGENT STOPPED SPEAKING');
      setAiAgentState(prev => ({ ...prev, isSpeaking: false }));
    };

    const onMessage = (message: any) => {
      console.log('💬 AI AGENT MESSAGE:', message);
      if (message?.message) {
        setAiAgentState(prev => ({ ...prev, lastMessage: message.message }));
      }
    };

    const onError = (error: any) => {
      console.error('❌ AI Agent error:', error);
      toast({
        title: "AI Agent Error",
        description: "There was an issue with the AI agent connection",
        variant: "destructive",
      });
    };

    // Setup event listeners
    refs.current.vapiClient.on('call-start', onCallStart);
    refs.current.vapiClient.on('call-end', onCallEnd);
    refs.current.vapiClient.on('speech-start', onSpeechStart);
    refs.current.vapiClient.on('speech-end', onSpeechEnd);
    refs.current.vapiClient.on('message', onMessage);
    refs.current.vapiClient.on('error', onError);
  };

  // Initialize user media
  const initializeMedia = async () => {
    try {
      console.log('📹 Initializing User Media');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      refs.current.audioStream = stream;
      
      console.log('✅ User Media Access Granted');
      
      if (refs.current.video) {
        refs.current.video.srcObject = stream;
      }

      // Setup audio analysis for speech detection
      refs.current.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      refs.current.analyser = refs.current.audioContext.createAnalyser();
      refs.current.analyser.fftSize = 256;

      const source = refs.current.audioContext.createMediaStreamSource(stream);
      source.connect(refs.current.analyser);
      
      console.log('🔊 Audio Context Setup Complete');

      // Monitor audio levels
      const checkAudioLevel = () => {
        if (!refs.current.analyser || !refs.current.initialized) return;
        
        const dataArray = new Uint8Array(refs.current.analyser.frequencyBinCount);
        refs.current.analyser.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedVolume = average / 256;

        if (normalizedVolume > 0.15 && !mediaState.isMuted && !aiAgentState.isSpeaking) {
          setUserIsSpeaking(true);
          
          if (refs.current.userSpeakingTimeout) {
            clearTimeout(refs.current.userSpeakingTimeout);
          }
          
          refs.current.userSpeakingTimeout = setTimeout(() => {
            setUserIsSpeaking(false);
          }, 500);
        }

        if (refs.current.initialized) {
          requestAnimationFrame(checkAudioLevel);
        }
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

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (refs.current.controlsTimeout) {
        clearTimeout(refs.current.controlsTimeout);
      }
      
      refs.current.controlsTimeout = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (refs.current.controlsTimeout) {
        clearTimeout(refs.current.controlsTimeout);
      }
    };
  }, []);

  // Connect AI Agent
  const connectAIAgent = async () => {
    if (!refs.current.vapiClient || !meeting.aiAgentId) {
      console.log('⚠️ Cannot connect AI agent - missing client or ID');
      return;
    }

    console.log('🤖 Connecting AI agent:', meeting.aiAgentId);
    
    try {
      await refs.current.vapiClient.start(meeting.aiAgentId);
      console.log('✅ AI agent connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect AI agent:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to AI agent",
        variant: "destructive",
      });
    }
  };

  // Disconnect AI Agent
  const disconnectAIAgent = () => {
    if (!refs.current.vapiClient) return;
    
    console.log('🔌 Disconnecting AI agent');
    
    try {
      refs.current.vapiClient.stop();
      console.log('✅ AI agent disconnected');
    } catch (error) {
      console.error('❌ Failed to disconnect AI agent:', error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    const newMutedState = !mediaState.isMuted;
    setMediaState(prev => ({ ...prev, isMuted: newMutedState }));
    
    if (refs.current.audioStream) {
      const audioTracks = refs.current.audioStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    toast({
      title: newMutedState ? "Microphone muted" : "Microphone unmuted",
      description: newMutedState ? "Your microphone is muted" : "You can now speak",
    });
  };

  // Toggle video
  const toggleVideo = () => {
    const newVideoState = !mediaState.video;
    setMediaState(prev => ({ ...prev, video: newVideoState }));
    
    if (refs.current.audioStream) {
      const videoTracks = refs.current.audioStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });
    }
    
    toast({
      title: newVideoState ? "Camera enabled" : "Camera disabled",
      description: newVideoState ? "Your camera is now on" : "Your camera is off",
    });
  };

  // Handle end meeting
  const handleEndMeeting = () => {
    console.log('🔚 Ending meeting');
    
    // Disconnect AI agent first
    if (aiAgentState.isConnected) {
      disconnectAIAgent();
    }
    
    // Cleanup and call parent callback
    cleanup();
    onEndMeeting();
    
    toast({
      title: "Meeting Ended",
      description: "The meeting has been ended successfully",
    });
  };

  // Test AI Response
  const testAIResponse = () => {
    if (!refs.current.vapiClient || !aiAgentState.isConnected) {
      toast({
        title: "AI Agent Not Connected",
        description: "Please connect to the AI agent first",
        variant: "destructive",
      });
      return;
    }

    console.log('🧪 Testing AI response...');
    
    // Send a test message to trigger AI response
    if (refs.current.vapiClient.sendTestMessage) {
      refs.current.vapiClient.sendTestMessage("Tell me about campaign strategies");
      
      toast({
        title: "AI Response Triggered",
        description: "Listen for the AI voice response",
      });
    }
  };

  // Format time utility
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
                  ref={(el) => { refs.current.video = el; }}
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

          {/* Test AI Response */}
          <Button
            onClick={testAIResponse}
            size="lg"
            variant="outline"
            className="rounded-full w-12 h-12 p-0"
          >
            <Volume2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 