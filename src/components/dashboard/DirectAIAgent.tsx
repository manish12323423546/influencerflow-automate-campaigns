import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Users,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  Play,
  Pause,
  Settings,
  Clock,
  Activity
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  mode?: 'chat' | 'campaign';
  data?: any;
}

interface ProgressUpdate {
  id: string;
  message: string;
  timestamp: Date;
  type: 'progress' | 'status_update' | 'complete' | 'error';
  data?: any;
}

interface CampaignData {
  query: string;
  recipient_email?: string;
  phone_number?: string;
  campaign_name?: string;
  additional_context?: any;
}

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'error';
  lastChecked: Date;
  backendInfo?: any;
}

const DirectAIAgent: React.FC = () => {
  // State management
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    lastChecked: new Date()
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<'chat' | 'campaign'>('chat');
  const [campaignData, setCampaignData] = useState<CampaignData>({ query: '' });
  const [conversationId, setConversationId] = useState<string>('');
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const progressEndRef = useRef<HTMLDivElement>(null);

  // Constants
  const BACKEND_URL = 'https://project-x-c0ml.onrender.com';
  const WS_URL = 'wss://project-x-c0ml.onrender.com';

  // Utility functions
  const log = (level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console[level](`[DirectAI ${timestamp}] ${message}`, data || '');
  };

  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    progressEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Connection management
  const checkBackendConnection = async () => {
    try {
      log('info', 'Checking backend connection...');
      setConnectionStatus(prev => ({ ...prev, status: 'connecting' }));

      const healthResponse = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        log('info', 'Health check passed', healthData);

        const infoResponse = await fetch(`${BACKEND_URL}/info`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (infoResponse.ok) {
          const infoData = await infoResponse.json();
          log('info', 'Backend info retrieved', infoData);

          setConnectionStatus({
            status: 'connected',
            lastChecked: new Date(),
            backendInfo: infoData
          });

          return true;
        }
      }

      throw new Error('Backend not responding properly');
    } catch (error) {
      log('error', 'Connection check failed', error);
      setConnectionStatus({
        status: 'error',
        lastChecked: new Date()
      });
      return false;
    }
  };

  // WebSocket management
  const connectWebSocket = () => {
    if (!conversationId) return;

    try {
      const ws = new WebSocket(`${WS_URL}/ws/${conversationId}`);
      
      ws.onopen = () => {
        log('info', 'WebSocket connected', { conversationId });
        setWebsocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('debug', 'WebSocket message received', data);

          if (data.event_type === 'progress') {
            const progressUpdate: ProgressUpdate = {
              id: `progress_${Date.now()}`,
              message: data.data.message,
              timestamp: new Date(data.timestamp),
              type: data.event_type,
              data: data.data
            };
            setProgressUpdates(prev => [...prev, progressUpdate]);
          } else if (data.event_type === 'message') {
            const message: Message = {
              id: `msg_${Date.now()}`,
              type: 'agent',
              content: data.data.content,
              timestamp: new Date(data.timestamp),
              data: data.data
            };
            setMessages(prev => [...prev, message]);
          } else if (data.event_type === 'status_update' || data.event_type === 'complete' || data.event_type === 'error') {
            const progressUpdate: ProgressUpdate = {
              id: `status_${Date.now()}`,
              message: data.data.message || data.data.status || 'Status update',
              timestamp: new Date(data.timestamp),
              type: data.event_type,
              data: data.data
            };
            setProgressUpdates(prev => [...prev, progressUpdate]);
          }
        } catch (error) {
          log('error', 'Failed to parse WebSocket message', { error, rawData: event.data });
        }
      };

      ws.onclose = () => {
        log('warn', 'WebSocket disconnected');
        setWebsocket(null);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (conversationId) {
            connectWebSocket();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        log('error', 'WebSocket error', error);
      };

    } catch (error) {
      log('error', 'Failed to create WebSocket connection', error);
    }
  };

  // API calls
  const sendChatMessage = async (message: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: conversationId
        })
      });

      if (response.ok) {
        const result = await response.json();
        log('info', 'Chat response received', result);

        if (result.success) {
          const agentMessage: Message = {
            id: `msg_${Date.now()}`,
            type: 'agent',
            content: result.message,
            timestamp: new Date(),
            mode: 'chat',
            data: result.data
          };
          setMessages(prev => [...prev, agentMessage]);

          // Add progress updates if any
          if (result.progress && Array.isArray(result.progress)) {
            result.progress.forEach((progressMsg: string) => {
              const progressUpdate: ProgressUpdate = {
                id: `progress_${Date.now()}_${Math.random()}`,
                message: progressMsg,
                timestamp: new Date(),
                type: 'progress'
              };
              setProgressUpdates(prev => [...prev, progressUpdate]);
            });
          }
        } else {
          throw new Error(result.message || 'Chat request failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      log('error', 'Chat message failed', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startCampaign = async (data: CampaignData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/campaign/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          conversation_id: conversationId
        })
      });

      if (response.ok) {
        const result = await response.json();
        log('info', 'Campaign response received', result);

        if (result.success) {
          const campaignMessage: Message = {
            id: `campaign_${Date.now()}`,
            type: 'agent',
            content: result.message,
            timestamp: new Date(),
            mode: 'campaign',
            data: result.data
          };
          setMessages(prev => [...prev, campaignMessage]);

          // Add progress updates
          if (result.progress && Array.isArray(result.progress)) {
            result.progress.forEach((progressMsg: string) => {
              const progressUpdate: ProgressUpdate = {
                id: `campaign_progress_${Date.now()}_${Math.random()}`,
                message: progressMsg,
                timestamp: new Date(),
                type: 'progress',
                data: { campaign: true }
              };
              setProgressUpdates(prev => [...prev, progressUpdate]);
            });
          }
        } else {
          throw new Error(result.message || 'Campaign start failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      log('error', 'Campaign start failed', error);
      const errorMessage: Message = {
        id: `campaign_error_${Date.now()}`,
        type: 'system',
        content: `Campaign Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Event handlers
  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentInput,
      timestamp: new Date(),
      mode: currentMode
    };

    setMessages(prev => [...prev, userMessage]);
    
    if (currentMode === 'chat') {
      await sendChatMessage(currentInput);
    } else {
      setCampaignData(prev => ({ ...prev, query: currentInput }));
    }

    setCurrentInput('');
  };

  const handleStartCampaign = async () => {
    if (!campaignData.query.trim() || isLoading) return;

    const campaignMessage: Message = {
      id: `campaign_start_${Date.now()}`,
      type: 'user',
      content: `🚀 Starting campaign: ${campaignData.query}`,
      timestamp: new Date(),
      mode: 'campaign'
    };

    setMessages(prev => [...prev, campaignMessage]);
    await startCampaign(campaignData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Effects
  useEffect(() => {
    log('info', 'DirectAIAgent initialized');
    setConversationId(generateConversationId());
    checkBackendConnection();

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'agent',
      content: `🤖 Welcome to your AI Campaign Assistant!

I'm connected to your deployed LangGraph multi-agent system at ${BACKEND_URL} and can help you with:

🎯 **Campaign Management**
- Create and manage campaigns
- Analyze performance and ROI
- Optimize campaign strategies

👥 **Influencer Discovery** 
- Find relevant creators
- Analyze audience fit
- Check engagement metrics

📧 **Automated Outreach**
- Send personalized emails
- Schedule phone calls
- Follow up on responses

📊 **Analytics & Reporting**
- Generate performance reports
- Track campaign metrics
- Monitor real-time progress

💼 **Contract Management**
- Generate contracts
- Manage agreements
- Handle payments

How can I assist you today?`,
      timestamp: new Date(),
      mode: 'chat'
    };
    setMessages([welcomeMessage]);

    // Check connection every 30 seconds
    const interval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (conversationId && connectionStatus.status === 'connected') {
      connectWebSocket();
    }
  }, [conversationId, connectionStatus.status]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, progressUpdates]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [websocket]);

  // Render functions
  const renderMessage = (message: Message) => (
    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-lg p-3 ${
        message.type === 'user' 
          ? 'bg-blue-500 text-white' 
          : message.type === 'agent'
          ? 'bg-gray-100 border'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          {message.type === 'user' ? '👤' : message.type === 'agent' ? '🤖' : '⚠️'}
          <span className="text-xs opacity-75">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.mode && (
            <Badge variant="outline" className="text-xs">
              {message.mode}
            </Badge>
          )}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.data && (
          <div className="mt-2 text-xs opacity-75">
            <details>
              <summary>Data</summary>
              <pre className="mt-1 text-xs">{JSON.stringify(message.data, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgressUpdate = (update: ProgressUpdate) => (
    <div key={update.id} className="flex items-start gap-2 p-2 border-l-4 border-blue-200 bg-blue-50 mb-2">
      <div className="flex-shrink-0 mt-1">
        {update.type === 'progress' && <Activity className="w-4 h-4 text-blue-500" />}
        {update.type === 'status_update' && <Clock className="w-4 h-4 text-yellow-500" />}
        {update.type === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {update.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex-1">
        <div className="text-sm">{update.message}</div>
        <div className="text-xs text-gray-500 mt-1">
          {update.timestamp.toLocaleTimeString()}
        </div>
        {update.data && (
          <div className="mt-1">
            <details className="text-xs">
              <summary className="cursor-pointer">Details</summary>
              <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto">
                {JSON.stringify(update.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={`border ${
        connectionStatus.status === 'connected' ? 'border-green-200 bg-green-50' :
        connectionStatus.status === 'error' ? 'border-red-200 bg-red-50' :
        'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus.status === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : connectionStatus.status === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
            )}
            <AlertDescription className={
              connectionStatus.status === 'connected' ? 'text-green-800' :
              connectionStatus.status === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }>
              {connectionStatus.status === 'connected' && 'Connected to Deployed LangGraph Multi-Agent System'}
              {connectionStatus.status === 'error' && 'Failed to connect to deployed AI agent backend'}
              {connectionStatus.status === 'connecting' && 'Connecting to deployed AI agent backend...'}
            </AlertDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {websocket && (
              <Badge variant="outline" className="text-xs">
                WebSocket: Connected
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkBackendConnection}
              disabled={connectionStatus.status === 'connecting'}
            >
              {connectionStatus.status === 'connecting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
      </Alert>

      {/* Backend Info */}
      {connectionStatus.backendInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Backend Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Service:</span> {connectionStatus.backendInfo.service}
              </div>
              <div>
                <span className="font-medium">Version:</span> {connectionStatus.backendInfo.version}
              </div>
              <div>
                <span className="font-medium">Capabilities:</span> {connectionStatus.backendInfo.capabilities?.join(', ')}
              </div>
              <div>
                <span className="font-medium">Status:</span> {connectionStatus.backendInfo.status}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main AI Agent Interface */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-500" />
              AI Campaign Assistant
              <Badge variant="outline">Direct API</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus.status === 'connected' ? 'default' : 'destructive'}>
                {connectionStatus.status}
              </Badge>
              {conversationId && (
                <Badge variant="outline" className="text-xs">
                  ID: {conversationId.slice(-8)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentMode} onValueChange={(value) => setCurrentMode(value as 'chat' | 'campaign')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat Mode
              </TabsTrigger>
              <TabsTrigger value="campaign" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Campaign Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chat Messages */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Conversation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 overflow-y-auto border rounded p-4 space-y-2">
                      {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                          <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Start a conversation with your AI assistant</p>
                        </div>
                      )}
                      {messages.map(renderMessage)}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Input
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about campaigns, influencers, analytics..."
                        disabled={isLoading || connectionStatus.status !== 'connected'}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !currentInput.trim() || connectionStatus.status !== 'connected'}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Updates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Real-time Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 overflow-y-auto border rounded p-4">
                      {progressUpdates.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Progress updates will appear here</p>
                        </div>
                      )}
                      {progressUpdates.map(renderProgressUpdate)}
                      <div ref={progressEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="campaign" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Campaign Configuration */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Campaign Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Campaign Description</label>
                      <Textarea
                        value={campaignData.query}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, query: e.target.value }))}
                        placeholder="Describe your campaign goals, target audience, and requirements..."
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Target Email</label>
                        <Input
                          value={campaignData.recipient_email || ''}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, recipient_email: e.target.value }))}
                          placeholder="influencer@example.com"
                          type="email"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                          value={campaignData.phone_number || ''}
                          onChange={(e) => setCampaignData(prev => ({ ...prev, phone_number: e.target.value }))}
                          placeholder="+1234567890"
                          type="tel"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Campaign Name</label>
                      <Input
                        value={campaignData.campaign_name || ''}
                        onChange={(e) => setCampaignData(prev => ({ ...prev, campaign_name: e.target.value }))}
                        placeholder="My Awesome Campaign"
                      />
                    </div>
                    <Button 
                      onClick={handleStartCampaign}
                      disabled={isLoading || !campaignData.query.trim() || connectionStatus.status !== 'connected'}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Campaign...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Campaign
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Campaign Messages & Updates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Campaign Execution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 overflow-y-auto border rounded p-4">
                      {messages.filter(msg => msg.mode === 'campaign').length === 0 && 
                       progressUpdates.filter(upd => upd.data?.campaign).length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                          <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Campaign execution updates will appear here</p>
                        </div>
                      )}
                      
                      {/* Show campaign messages */}
                      {messages.filter(msg => msg.mode === 'campaign').map(renderMessage)}
                      
                      {/* Show campaign progress */}
                      {progressUpdates.filter(upd => upd.data?.campaign).map(renderProgressUpdate)}
                      
                      <div ref={progressEndRef} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentMode('chat');
                setCurrentInput('Show me my active campaigns');
                handleSendMessage();
              }}
              disabled={connectionStatus.status !== 'connected'}
            >
              <FileText className="w-4 h-4" />
              View Campaigns
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentMode('chat');
                setCurrentInput('Find tech influencers with high engagement');
                handleSendMessage();
              }}
              disabled={connectionStatus.status !== 'connected'}
            >
              <Users className="w-4 h-4" />
              Find Influencers
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentMode('chat');
                setCurrentInput('Generate a performance report for my recent campaigns');
                handleSendMessage();
              }}
              disabled={connectionStatus.status !== 'connected'}
            >
              <TrendingUp className="w-4 h-4" />
              Performance Report
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setCurrentMode('campaign');
                setCampaignData({ query: 'Create a tech influencer campaign for a new mobile app launch targeting Gen Z audience' });
              }}
              disabled={connectionStatus.status !== 'connected'}
            >
              <Zap className="w-4 h-4" />
              Quick Campaign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm text-gray-700">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Backend URL:</span>
              <div className="text-xs text-gray-600">{BACKEND_URL}</div>
            </div>
            <div>
              <span className="font-medium">WebSocket:</span>
              <div className="text-xs text-gray-600">{websocket ? 'Connected' : 'Disconnected'}</div>
            </div>
            <div>
              <span className="font-medium">Conversation ID:</span>
              <div className="text-xs text-gray-600">{conversationId}</div>
            </div>
            <div>
              <span className="font-medium">Last Check:</span>
              <div className="text-xs text-gray-600">{connectionStatus.lastChecked.toLocaleTimeString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectAIAgent; 