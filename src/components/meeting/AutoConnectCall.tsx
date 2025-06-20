/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, PhoneOff, Clock, Bot, Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi/vapiClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "react-router-dom";

// Simple call status enum
const CallStatus = {
  CONNECTING: "CONNECTING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

type Props = {
  userName?: string;
  assistantId: string;
  assistantName?: string;
  callTimeLimit?: number; 
  meetingId: string;
  onCallEnd?: () => void;
};

const AutoConnectCall = ({
  userName = "User",
  assistantId,
  assistantName = "AI Assistant",
  callTimeLimit = 180, // 3 minutes default
  meetingId,
  onCallEnd,
}: Props) => {
  const { toast } = useToast();
  const router = useRouter();
  const [callStatus, setCallStatus] = useState(CallStatus.CONNECTING);
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [userIsSpeaking, setUserIsSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(callTimeLimit);
  const [transcript, setTranscript] = useState<string[]>([]);

  // Single ref for all timers and audio context
  const refs = useRef({
    countdownTimer: undefined as NodeJS.Timeout | undefined,
    audioStream: null as MediaStream | null,
    userSpeakingTimeout: undefined as NodeJS.Timeout | undefined,
  });

  // Simple audio setup for speech detection
  const setupAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      refs.current.audioStream = stream;

      // Setup basic volume detection for user speaking indicator
      const audioContext = new AudioContext();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyzer);
      analyzer.fftSize = 256;
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const detectSpeech = () => {
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        
        if (average > 50) { // Threshold for speech detection
          setUserIsSpeaking(true);
          
          // Clear existing timeout
          if (refs.current.userSpeakingTimeout) {
            clearTimeout(refs.current.userSpeakingTimeout);
          }
          
          // Set new timeout to stop speaking indicator
          refs.current.userSpeakingTimeout = setTimeout(() => {
            setUserIsSpeaking(false);
          }, 1000);
        }
        
        if (callStatus === CallStatus.ACTIVE) {
          requestAnimationFrame(detectSpeech);
        }
      };
      
      detectSpeech();
    } catch (error) {
      console.error("Failed to setup audio:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access for voice calls",
        variant: "destructive",
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (refs.current.countdownTimer) {
      clearInterval(refs.current.countdownTimer);
      refs.current.countdownTimer = undefined;
    }
    
    if (refs.current.userSpeakingTimeout) {
      clearTimeout(refs.current.userSpeakingTimeout);
      refs.current.userSpeakingTimeout = undefined;
    }
    
    if (refs.current.audioStream) {
      refs.current.audioStream.getTracks().forEach(track => track.stop());
      refs.current.audioStream = null;
    }
  };

  // Stop call function
  const stopCall = async () => {
    try {
      await vapi.stop();
      setCallStatus(CallStatus.FINISHED);
      cleanup();
      
      toast({
        title: "Call ended",
        description: "Your AI meeting has ended successfully",
      });
      
      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error("Error stopping call:", error);
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
    
    if (refs.current.audioStream) {
      refs.current.audioStream.getAudioTracks().forEach(track => {
        track.enabled = isMicMuted; // Will be opposite after state update
      });
    }
    
    toast({
      title: isMicMuted ? "Microphone unmuted" : "Microphone muted",
      description: isMicMuted ? "You can now speak" : "Your microphone is muted",
    });
  };

  // Go back to dashboard
  const goToDashboard = () => {
    router.push('/dashboard?tab=meeting-ai');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-start call when component mounts
  useEffect(() => {
    const startCall = async () => {
      try {
        console.log("🚀 Starting call with assistant:", assistantId);
        await vapi.start(assistantId);
        
        toast({
          title: "Connecting to AI Assistant",
          description: `Starting conversation with ${assistantName}`,
        });
      } catch (error) {
        console.error("Failed to start call:", error);
        setCallStatus(CallStatus.FINISHED);
        
        toast({
          title: "Connection failed",
          description: "Could not connect to AI assistant",
          variant: "destructive",
        });
      }
    };

    startCall();
    
    // Cleanup on unmount
    return () => {
      cleanup();
      if (callStatus === CallStatus.ACTIVE) {
        vapi.stop().catch(console.error);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Setup event listeners
  useEffect(() => {
    // Call event handlers
    const onCallStart = async () => {
      console.log("Call started");
      setCallStatus(CallStatus.ACTIVE);
      setupAudio();

      // Add initial transcript message
      setTranscript(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connected to ${assistantName}`]);

      // Start countdown timer from specified limit
      setTimeRemaining(callTimeLimit);
      refs.current.countdownTimer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(refs.current.countdownTimer);
            stopCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setCallStatus(CallStatus.FINISHED);
      cleanup();
    };

    const onSpeechStart = () => {
      setAssistantIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setAssistantIsSpeaking(false);
    };

    const onMessage = (message: any) => {
      if (message && message.message) {
        const timestamp = new Date().toLocaleTimeString();
        setTranscript(prev => [...prev, `[${timestamp}] AI: ${message.message}`]);
      }
    };

    const onError = (error: Error) => {
      console.error("VAPI error:", error);
      setCallStatus(CallStatus.FINISHED);
      cleanup();
      
      toast({
        title: "Connection error",
        description: "Lost connection to AI assistant",
        variant: "destructive",
      });
    };

    // Set up event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    // Clean up event listeners
    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, [userName, callTimeLimit]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-blue-600" />
                <span>AI Meeting with {assistantName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={goToDashboard}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video/Avatar Section */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center relative">
                {/* AI Assistant Avatar */}
                <div className="text-center text-white">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white/20">
                    <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${assistantName}`} />
                    <AvatarFallback>
                      <Bot className="w-12 h-12" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold mb-2">{assistantName}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      callStatus === CallStatus.ACTIVE ? "bg-green-500" : 
                      callStatus === CallStatus.CONNECTING ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span>
                      {callStatus === CallStatus.ACTIVE ? "Connected" :
                       callStatus === CallStatus.CONNECTING ? "Connecting..." : "Disconnected"}
                    </span>
                  </div>
                </div>

                {/* Speaking indicators */}
                {assistantIsSpeaking && (
                  <div className="absolute bottom-4 left-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                )}

                {userIsSpeaking && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      You're speaking
                    </div>
                  </div>
                )}

                {/* Call timer */}
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeRemaining)}
                </div>

                {/* Connection overlay */}
                {callStatus === CallStatus.CONNECTING && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Connecting to AI Assistant...</p>
                    </div>
                  </div>
                )}

                {callStatus === CallStatus.FINISHED && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-lg font-semibold mb-2">Call Ended</h3>
                      <p className="text-sm opacity-75 mb-4">Thank you for using our AI meeting service</p>
                      <Button onClick={goToDashboard} variant="secondary">
                        Return to Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="p-4 bg-white border-t">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isMicMuted ? "destructive" : "secondary"}
                    size="sm"
                    onClick={toggleMic}
                    disabled={callStatus !== CallStatus.ACTIVE}
                  >
                    {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={stopCall}
                    disabled={callStatus === CallStatus.FINISHED}
                  >
                    <PhoneOff className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Conversation Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-2">
                {transcript.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Conversation will appear here...</p>
                  </div>
                ) : (
                  transcript.map((line, index) => (
                    <div key={index} className="text-sm">
                      {line.includes('AI:') ? (
                        <div className="text-blue-600 font-medium">{line}</div>
                      ) : line.includes('You:') ? (
                        <div className="text-green-600 font-medium">{line}</div>
                      ) : (
                        <div className="text-gray-600">{line}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Meeting info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Meeting Information</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>Meeting ID: {meetingId}</div>
                  <div>Assistant: {assistantName}</div>
                  <div>Duration: {callTimeLimit / 60} minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutoConnectCall; 