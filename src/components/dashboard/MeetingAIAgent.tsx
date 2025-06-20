import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Plus, 
  Search,
  Settings,
  Trash2,
  Edit,
  Play,
  Phone,
  Info,
  Loader2,
  X,
  Mic,
  MicOff,
  PhoneOff,
  Clock
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LiveMeetingView } from '@/components/meeting/LiveMeetingView';

// Types based on webinar-ai-main structure
interface AIAgent {
  id: string;
  name: string;
  model: string;
  provider: string;
  prompt: string;
  firstMessage: string;
  createdAt: string;
  isActive: boolean;
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  aiAgentId: string;
  aiAgentName: string;
  status: 'scheduled' | 'live' | 'ended';
  startTime: string;
  duration: number;
  participants: number;
  meetingUrl: string;
  createdAt: string;
}

interface CallSession {
  id: string;
  meetingId: string;
  status: 'connecting' | 'connected' | 'ended';
  duration: number;
  isRecording: boolean;
  isMuted: boolean;
  isAISpeaking: boolean;
  transcript: string[];
}

// Local Storage Keys
const STORAGE_KEYS = {
  AI_AGENTS: 'meeting_ai_agents',
  MEETINGS: 'meetings',
  SELECTED_AGENT: 'selected_ai_agent'
};

// Default AI prompts from webinar-ai-main structure
const DEFAULT_PROMPTS = {
  BRAND_REPRESENTATIVE: `Hey! This is your brand representative from our partnerships team. I've been checking out your content and I'm really excited to chat with you about an amazing campaign opportunity we have. Are you ready to hear about something that could be a perfect fit for your audience?`,
  
  SALES_AGENT: `Hello! I'm your dedicated sales assistant. I'm here to help you understand our services, answer any questions, and guide you through our offerings. I'm excited to discuss how we can help grow your brand partnerships!`,
  
  CUSTOMER_SUPPORT: `Hi there! I'm your customer support assistant. I'm here to help you with any questions, troubleshoot issues, and ensure you have the best possible experience. How can I assist you today?`
};

// AI Agent Store (Zustand-like but using React state)
const useAiAgentStore = () => {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_AGENT);
    if (stored) {
      try {
        setSelectedAgent(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse selected agent:', error);
      }
    }
  }, []);

  const selectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    localStorage.setItem(STORAGE_KEYS.SELECTED_AGENT, JSON.stringify(agent));
  };

  const clearAgent = () => {
    setSelectedAgent(null);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_AGENT);
  };

  return { selectedAgent, selectAgent, clearAgent };
};

// Create Assistant Modal Component
const CreateAssistantModal = ({ isOpen, onClose, onAgentCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: AIAgent) => void;
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [useDefaultAgent, setUseDefaultAgent] = useState(true);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Starting AI agent creation process...', {
      agentName: name,
      useDefaultAgent,
      timestamp: new Date().toISOString()
    });
    
    setLoading(true);
    try {
      // Import the createAssistant action dynamically
      const { createAssistant } = await import('@/actions/vapi');
      
      const result = await createAssistant(name, 'demo-user', useDefaultAgent);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create assistant');
      }

      console.log('✅ Assistant created successfully via VAPI:', {
        assistantId: result.data.id,
        assistantName: name,
        timestamp: new Date().toISOString()
      });

      // Create agent object for local state
      const newAgent: AIAgent = {
        id: result.data.id, // Use the assistant ID for calls
        name: result.data.name,
        model: result.data.model,
        provider: result.data.provider,
        prompt: result.data.prompt,
        firstMessage: result.data.firstMessage,
        createdAt: result.data.createdAt,
        isActive: result.data.isActive
      };

      // Save to localStorage on client side
      const existingAgents = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_AGENTS) || '[]');
      const updatedAgents = [...existingAgents, newAgent];
      localStorage.setItem(STORAGE_KEYS.AI_AGENTS, JSON.stringify(updatedAgents));

      onAgentCreated(newAgent);
      setName('');
      onClose();
      toast({
        title: "Success",
        description: "Assistant created successfully",
      });
    } catch (error) {
      console.error('🔴 Error in handleSubmit:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Error",
        description: "Failed to create assistant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Assistant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block font-medium mb-2">Assistant Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter assistant name"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              This name will be used to identify your assistant.
            </p>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <Switch
              id="default-agent"
              checked={useDefaultAgent}
              onCheckedChange={setUseDefaultAgent}
            />
            <Label htmlFor="default-agent">Use default brand campaign agent</Label>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assistant'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// AI Agent Sidebar Component
const AiAgentSidebar = ({ aiAgents, onAgentSelect, selectedAgent, onCreateAgent }: {
  aiAgents: AIAgent[];
  onAgentSelect: (agent: AIAgent) => void;
  selectedAgent: AIAgent | null;
  onCreateAgent: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = aiAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-[300px] border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4">
        <Button
          className="w-full flex items-center gap-2 mb-4"
          onClick={onCreateAgent}
        >
          <Plus className="h-4 w-4" /> Create Assistant
        </Button>
        <div className="relative">
          <Input
            placeholder="Search Assistants"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className={cn(
              "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
              agent.id === selectedAgent?.id && "bg-coral/10 border-r-2 border-coral"
            )}
            onClick={() => onAgentSelect(agent)}
          >
            <div className="font-medium">{agent.name}</div>
            <div className="text-sm text-gray-500">{agent.model}</div>
          </div>
        ))}
        
        {filteredAgents.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No agents found' : 'No agents created yet'}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Model Configuration Component
const ModelConfiguration = ({ agent, onUpdate }: {
  agent: AIAgent;
  onUpdate: (updatedAgent: AIAgent) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [firstMessage, setFirstMessage] = useState(agent.firstMessage || '');
  const [systemPrompt, setSystemPrompt] = useState(agent.prompt || '');
  const { toast } = useToast();

  useEffect(() => {
    setFirstMessage(agent.firstMessage || '');
    setSystemPrompt(agent.prompt || '');
  }, [agent]);

  const handleUpdateAssistant = async () => {
    setLoading(true);
    try {
      const updatedAgent = {
        ...agent,
        firstMessage,
        prompt: systemPrompt
      };

      // Update in localStorage
      const existingAgents = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_AGENTS) || '[]');
      const updatedAgents = existingAgents.map((a: AIAgent) => 
        a.id === agent.id ? updatedAgent : a
      );
      localStorage.setItem(STORAGE_KEYS.AI_AGENTS, JSON.stringify(updatedAgents));

      onUpdate(updatedAgent);
      toast({
        title: "Success",
        description: "Assistant updated successfully",
      });
    } catch (error) {
      console.error('Error updating assistant:', error);
      toast({
        title: "Error",
        description: "Failed to update assistant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Model Configuration</h2>
        <Button onClick={handleUpdateAssistant} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Updating...
            </>
          ) : (
            'Update Assistant'
          )}
        </Button>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Configure the behavior of the assistant.
      </p>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <label className="font-medium">First Message</label>
          <Info className="h-4 w-4 text-gray-500 ml-2" />
        </div>
        <Input
          value={firstMessage}
          onChange={(e) => setFirstMessage(e.target.value)}
          placeholder="Enter the first message..."
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <label className="font-medium">System Prompt</label>
            <Info className="h-4 w-4 text-gray-500 ml-2" />
          </div>
        </div>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="min-h-[300px] max-h-[500px] font-mono text-sm"
          placeholder="Enter the system prompt..."
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block font-medium mb-2">Provider</label>
          <Input value={agent.provider || 'openai'} disabled />
        </div>
        <div>
          <label className="block font-medium mb-2">Model</label>
          <Input value={agent.model || 'gpt-4o'} disabled />
        </div>
      </div>
    </div>
  );
};

// Main Model Section Component
const ModelSection = ({ selectedAgent, onUpdate }: {
  selectedAgent: AIAgent | null;
  onUpdate: (agent: AIAgent) => void;
}) => {
  if (!selectedAgent) {
    return (
      <div className="p-8 flex-1 overflow-auto">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" />
          <span className="uppercase text-sm font-medium">MODEL</span>
        </div>
        <div className="flex justify-center items-center h-[500px] w-full">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 w-full">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              No assistant selected. Please select an assistant to configure the model settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex-1 overflow-auto">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5" />
        <span className="uppercase text-sm font-medium">MODEL</span>
      </div>
      <ScrollArea>
        <ModelConfiguration agent={selectedAgent} onUpdate={onUpdate} />
      </ScrollArea>
    </div>
  );
};

// Auto Connect Call Component based on webinar-ai-main
const AutoConnectCall = ({ assistantId, assistantName, onCallEnd }: {
  assistantId: string;
  assistantName: string;
  onCallEnd: () => void;
}) => {
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'finished'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes
  const [assistantIsSpeaking, setAssistantIsSpeaking] = useState(false);
  const [userIsSpeaking, setUserIsSpeaking] = useState(false);
  const { toast } = useToast();

  // VAPI client reference
  const [vapiClientRef, setVapiClientRef] = useState<any>(null);

  const initializeVapi = async () => {
    try {
      if (vapiClientRef) {
        return vapiClientRef;
      }

      // Import VAPI client
      const { vapi } = await import('@/lib/vapi/vapiClient');
      setVapiClientRef(vapi);
      return vapi;
    } catch (error) {
      console.error('Failed to load VAPI client:', error);
      
      // Fallback to a basic demo client if import fails
      const fallbackClient = {
        start: async (assistantId: string) => {
          console.log('🎭 Fallback: Starting call with assistant:', assistantId);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('vapi-call-start', { detail: { assistantId } }));
          }, 1000);
        },
        stop: () => {
          console.log('🎭 Fallback: Stopping call');
          window.dispatchEvent(new CustomEvent('vapi-call-end', { detail: {} }));
        },
        on: (event: string, callback: Function) => {
          console.log('🎭 Fallback: Registering event listener for:', event);
          const eventMap: { [key: string]: string } = {
            'call-start': 'vapi-call-start',
            'call-end': 'vapi-call-end',
            'speech-start': 'vapi-speech-start',
            'speech-end': 'vapi-speech-end'
          };
          const domEvent = eventMap[event];
          if (domEvent) {
            window.addEventListener(domEvent, (e: any) => callback(e.detail));
          }
        },
        off: () => {}
      };
      
      setVapiClientRef(fallbackClient);
      return fallbackClient;
    }
  };

  // Setup audio and speech detection
  const setupAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Simple speech detection using AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyzer);

      // Monitor audio levels
      const checkAudioLevel = () => {
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedVolume = average / 256;

        // Detect speech based on volume
        if (normalizedVolume > 0.15 && !assistantIsSpeaking && !isMuted) {
          setUserIsSpeaking(true);
          
          // Reset after short delay
          setTimeout(() => setUserIsSpeaking(false), 500);
        }

        // Continue monitoring if call is active
        if (callStatus === 'active') {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
      return stream;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return null;
    }
  };

  // Start the call
  const startCall = async () => {
    try {
      setCallStatus('connecting');
      
      const vapiClient = await initializeVapi();
      if (!vapiClient) {
        throw new Error('VAPI client not available');
      }

      // Setup VAPI event listeners
      vapiClient.on('call-start', () => {
        console.log('Call started');
        setCallStatus('active');
        toast({
          title: "Success",
          description: "Call started successfully",
        });
      });

      vapiClient.on('speech-start', () => {
        setAssistantIsSpeaking(true);
      });

      vapiClient.on('speech-end', () => {
        setAssistantIsSpeaking(false);
      });

      vapiClient.on('call-end', () => {
        setCallStatus('finished');
      });

      vapiClient.on('error', (error: any) => {
        console.error('VAPI error:', error);
        toast({
          title: "Error",
          description: "Call failed. Please try again.",
          variant: "destructive",
        });
        setCallStatus('finished');
      });

      // Start the call
      await vapiClient.start(assistantId);
      
      // Setup audio monitoring
      setupAudio();
      
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: "Error",
        description: "Failed to start call. Please try again.",
        variant: "destructive",
      });
      setCallStatus('finished');
    }
  };

  // Stop the call
  const stopCall = async () => {
    try {
      const vapiClient = await initializeVapi();
      if (vapiClient) {
        vapiClient.stop();
      }
      setCallStatus('finished');
      
      toast({
        title: "Success",
        description: "Call ended successfully",
      });
    } catch (error) {
      console.error('Failed to stop call:', error);
      toast({
        title: "Error",
        description: "Failed to stop call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    stopCall();
    onCallEnd();
  };

  // Initialize call on mount
  useEffect(() => {
    startCall();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (callStatus === 'active') {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleEndCall();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  if (callStatus === 'finished') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center max-w-md w-full mx-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your call with {assistantName} has ended.
            </p>
          </div>
          <Button onClick={onCallEnd} className="w-full">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center max-w-md w-full mx-4">
        <div className="mb-6">
          <div className="w-24 h-24 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Bot className="w-12 h-12 text-coral" />
            {assistantIsSpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-coral animate-pulse" />
            )}
          </div>
          <h2 className="text-xl font-semibold mb-2">{assistantName}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {callStatus === 'connecting' ? 'Connecting...' : 'Call in progress'}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
          </div>
          
          {userIsSpeaking && (
            <div className="text-sm text-coral mb-2">You are speaking...</div>
          )}
          {assistantIsSpeaking && (
            <div className="text-sm text-blue-600 mb-2">{assistantName} is speaking...</div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full w-14 h-14"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Meeting Management Component
const MeetingManagement = ({ agents, onStartMeeting }: { 
  agents: AIAgent[];
  onStartMeeting: (meeting: Meeting) => void;
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedMeetings = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    if (storedMeetings) {
      try {
        setMeetings(JSON.parse(storedMeetings));
      } catch (error) {
        console.error('Failed to load meetings:', error);
      }
    }
  }, []);

  const createMeeting = (agentId: string, title: string, description: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const newMeeting: Meeting = {
      id: uuidv4(),
      title,
      description,
      aiAgentId: agentId,
      aiAgentName: agent.name,
      status: 'scheduled',
      startTime: new Date().toISOString(),
      duration: 30,
      participants: 1,
      meetingUrl: `${window.location.origin}/meeting/${uuidv4()}`,
      createdAt: new Date().toISOString()
    };

    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(updatedMeetings));
    setShowCreateMeeting(false);

    toast({
      title: "Success",
      description: "Meeting created successfully",
    });
  };

  const startMeeting = (meeting: Meeting) => {
    const agent = agents.find(a => a.id === meeting.aiAgentId);
    if (!agent) {
      toast({
        title: "Error",
        description: "AI agent not found",
        variant: "destructive",
      });
      return;
    }

    // Update meeting status to live
    const updatedMeetings = meetings.map(m => 
      m.id === meeting.id ? { ...m, status: 'live' as const } : m
    );
    setMeetings(updatedMeetings);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(updatedMeetings));

    // Start the live meeting
    onStartMeeting({ ...meeting, status: 'live' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Meetings</h2>
        <Button onClick={() => setShowCreateMeeting(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{meeting.title}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    with {meeting.aiAgentName}
                  </p>
                </div>
                <Badge variant={meeting.status === 'scheduled' ? 'default' : 'secondary'}>
                  {meeting.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {meeting.description}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => startMeeting(meeting)} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start Meeting
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {meetings.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No meetings created yet. Create your first meeting to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateMeeting && (
        <CreateMeetingModal
          agents={agents}
          onClose={() => setShowCreateMeeting(false)}
          onCreate={createMeeting}
        />
      )}

      {/* Live Meeting will be handled by parent component */}
    </div>
  );
};

// Create Meeting Modal
const CreateMeetingModal = ({ agents, onClose, onCreate }: {
  agents: AIAgent[];
  onClose: () => void;
  onCreate: (agentId: string, title: string, description: string) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && selectedAgentId) {
      onCreate(selectedAgentId, title, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md p-6 border shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Meeting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-medium mb-2">Meeting Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter meeting description"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block font-medium mb-2">AI Agent</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an AI agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={!title || !selectedAgentId}>
              Create Meeting
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Meeting AI Agent Component
const MeetingAIAgent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agents' | 'meetings'>('agents');
  const [aiAgents, setAIAgents] = useState<AIAgent[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const { selectedAgent, selectAgent, clearAgent } = useAiAgentStore();
  const { toast } = useToast();

  // Load data from localStorage on mount
  useEffect(() => {
    const storedAgents = localStorage.getItem(STORAGE_KEYS.AI_AGENTS);
    if (storedAgents) {
      try {
        setAIAgents(JSON.parse(storedAgents));
      } catch (error) {
        console.error('Failed to load AI agents:', error);
      }
    }
  }, []);

  const handleAgentCreated = (newAgent: AIAgent) => {
    setAIAgents(prev => [...prev, newAgent]);
    selectAgent(newAgent);
  };

  const handleAgentUpdate = (updatedAgent: AIAgent) => {
    setAIAgents(prev => prev.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    ));
    selectAgent(updatedAgent);
  };

  const loadDemoData = async () => {
    console.log('🎭 Loading demo data with real VAPI assistants...');
    
    try {
      // Import the createAssistant action
      const { createAssistant } = await import('@/actions/vapi');
      
      const demoAgentConfigs = [
        {
          name: 'Brand Representative',
          useDefaultAgent: true
        },
        {
          name: 'Sales Agent', 
          useDefaultAgent: false
        },
        {
          name: 'Customer Support',
          useDefaultAgent: false
        }
      ];

      const demoAgents = [];
      
      for (const config of demoAgentConfigs) {
        try {
          console.log(`🔄 Creating demo agent: ${config.name}`);
          const result = await createAssistant(config.name, 'demo-user', config.useDefaultAgent);
          
                     if (result.success) {
             const agent = {
               id: result.data.id,
               name: result.data.name,
               model: result.data.model,
               provider: result.data.provider,
               prompt: result.data.prompt,
               firstMessage: result.data.firstMessage,
               createdAt: result.data.createdAt,
               isActive: result.data.isActive
             };
             demoAgents.push(agent);
             console.log('✅ Demo agent created:', agent.name, 'with assistant ID:', agent.id);
          } else {
            console.error('❌ Failed to create demo agent:', config.name, result.message);
          }
        } catch (error) {
          console.error('❌ Error creating demo agent:', config.name, error);
        }
      }

      if (demoAgents.length > 0) {
        setAIAgents(demoAgents);
        localStorage.setItem(STORAGE_KEYS.AI_AGENTS, JSON.stringify(demoAgents));
        selectAgent(demoAgents[0]);
        
        toast({
          title: "Success",
          description: `Demo data loaded successfully (${demoAgents.length} agents created with real VAPI IDs)`,
        });
      } else {
        throw new Error('No demo agents were created successfully');
      }
    } catch (error) {
      console.error('🔴 Error loading demo data:', error);
      toast({
        title: "Error",
        description: "Failed to load demo data. Using fallback demo agents.",
        variant: "destructive",
      });
      
      // Fallback to original demo data if VAPI creation fails - with proper UUIDs
      const fallbackAgents: AIAgent[] = [
        {
          id: uuidv4(), // Generate proper UUID for demo agent
          name: 'Demo Brand Representative',
          model: 'gpt-4o',
          provider: 'openai',
          prompt: DEFAULT_PROMPTS.BRAND_REPRESENTATIVE,
          firstMessage: 'Hey! This is your demo brand representative. I\'m excited to discuss partnership opportunities with you!',
          createdAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: uuidv4(), // Generate proper UUID for demo agent
          name: 'Demo Sales Agent',
          model: 'gpt-4o',
          provider: 'openai',
          prompt: DEFAULT_PROMPTS.SALES_AGENT,
          firstMessage: 'Hello! I\'m your sales assistant. I\'m excited to help you understand our services and guide you through our offerings!',
          createdAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: uuidv4(), // Generate proper UUID for demo agent
          name: 'Demo Customer Support',
          model: 'gpt-4o',
          provider: 'openai',
          prompt: DEFAULT_PROMPTS.CUSTOMER_SUPPORT,
          firstMessage: 'Hi there! I\'m your customer support assistant. How can I assist you today?',
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ];
      
      setAIAgents(fallbackAgents);
      localStorage.setItem(STORAGE_KEYS.AI_AGENTS, JSON.stringify(fallbackAgents));
      selectAgent(fallbackAgents[0]);
    }
  };

  // If there's an active meeting, show the Live Meeting View
  if (activeMeeting) {
    return (
      <LiveMeetingView
        meeting={activeMeeting}
        onEndMeeting={() => setActiveMeeting(null)}
      />
    );
  }

  return (
    <div className="w-full h-[80vh] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'agents' 
                ? "bg-coral text-white" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            AI Agents
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'meetings' 
                ? "bg-coral text-white" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            Meetings
          </button>
          
          <div className="ml-auto">
            <Button onClick={loadDemoData} variant="outline" size="sm">
              Load Demo Data
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'agents' && (
        <div className="flex h-full">
          <AiAgentSidebar
            aiAgents={aiAgents}
            onAgentSelect={selectAgent}
            selectedAgent={selectedAgent}
            onCreateAgent={() => setShowCreateModal(true)}
          />
          <ModelSection 
            selectedAgent={selectedAgent} 
            onUpdate={handleAgentUpdate}
          />
        </div>
      )}

      {activeTab === 'meetings' && (
        <MeetingManagement 
          agents={aiAgents} 
          onStartMeeting={setActiveMeeting}
        />
      )}

      {/* Create Assistant Modal */}
      <CreateAssistantModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAgentCreated={handleAgentCreated}
      />
    </div>
  );
};

export default MeetingAIAgent; 