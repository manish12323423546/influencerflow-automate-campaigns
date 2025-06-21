// ElevenLabs Conversational AI Integration
// Direct WebSocket connection to ElevenLabs Conversational AI agents

// Configuration for different agent types
const CONVERSATIONAL_AI_AGENTS = {
  DEFAULT: 'agent_01jy6yks53en78yqrr186qxywa',
  BRAND_REP: 'agent_01jy6yks53en78yqrr186qxywa',
  SALES: 'agent_01jy6yks53en78yqrr186qxywa',
  SUPPORT: 'agent_01jy6yks53en78yqrr186qxywa'
};

export interface ConversationalAIConfig {
  apiKey: string;
  agentId?: string;
  language?: string;
}

export interface ConversationMessage {
  role: 'user' | 'agent';
  message: string;
  time_in_call_secs: number;
  tool_calls?: any[];
  tool_results?: any[];
  feedback?: any;
  source_medium?: string;
  interrupted?: boolean;
}

export interface ConversationMetrics {
  conversation_id: string;
  conversation_status: 'active' | 'ended';
  user_count: number;
  user_engagement_metrics: {
    speaking_percentage: number;
    interaction_frequency: number;
  };
  cost: {
    total_cost: number;
    tts_characters: number;
    stt_characters: number;
    llm_tokens: number;
  };
}

const getAgentId = (): string => {
  // For browser environments with import.meta.env
  if (typeof window !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env.VITE_ELEVENLABS_AGENT_ID_MAIN ||
           import.meta.env.ELEVENLABS_AGENT_ID_MAIN ||
           CONVERSATIONAL_AI_AGENTS.DEFAULT;
  }
  
  // For Node.js/server environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ELEVENLABS_AGENT_ID_MAIN ||
           process.env.VITE_ELEVENLABS_AGENT_ID_MAIN ||
           CONVERSATIONAL_AI_AGENTS.DEFAULT;
  }
  
  return CONVERSATIONAL_AI_AGENTS.DEFAULT;
};

class ElevenLabsConversationalAI {
  private apiKey: string;
  private baseUrl: string = 'wss://api.elevenlabs.io/v1/convai/conversation';
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private isCallActive: boolean = false;
  private currentConversationId: string = '';
  private websocket: WebSocket | null = null;
  private currentAgentId: string = '';
  private callStartTime: number = 0;
  private callTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private isConnected: boolean = false;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlayingAudio: boolean = false;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.includes('your_') || apiKey.length < 10) {
      throw new Error('Valid ElevenLabs API key is required for Conversational AI');
    }
    
    this.apiKey = apiKey;
    console.log('🎤 ElevenLabs Conversational AI initialized (Production Mode):', {
      hasApiKey: true,
      apiKeyLength: apiKey.length,
      defaultAgent: CONVERSATIONAL_AI_AGENTS.DEFAULT,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start a conversation with the ElevenLabs Conversational AI agent
   */
  async start(agentId: string = CONVERSATIONAL_AI_AGENTS.DEFAULT): Promise<void> {
    try {
      this.currentAgentId = agentId;
      this.callStartTime = Date.now();
      
      console.log('🚀 Starting ElevenLabs Conversational AI session:', {
        agentId,
        timestamp: new Date().toISOString()
      });

      // Initialize audio context and get user media
      await this.initializeAudio();

      // Connect to WebSocket
      await this.connectWebSocket();
      
      this.isCallActive = true;
      this.emit('call-start', { agentId });

      // Start call duration timer
      this.callTimer = setInterval(() => {
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.emit('call-duration-update', { duration });
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to start ElevenLabs Conversational AI:', error);
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Initialize audio context and get user media access
   */
  private async initializeAudio(): Promise<void> {
    try {
      console.log('🎧 Initializing audio for ElevenLabs Conversational AI...');
      
      // Get user media (microphone access)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      console.log('✅ Audio initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize audio:', error);
      throw new Error('Microphone access is required for voice conversation');
    }
  }

  /**
   * Connect to WebSocket for real-time audio streaming
   */
  private async connectWebSocket(): Promise<void> {
    try {
      const wsUrl = `${this.baseUrl}?agent_id=${encodeURIComponent(this.currentAgentId)}`;
      
      console.log('🔌 Connecting to ElevenLabs WebSocket:', {
        url: wsUrl,
        agentId: this.currentAgentId
      });

      this.websocket = new WebSocket(wsUrl);
      this.websocket.binaryType = 'arraybuffer';

      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('WebSocket creation failed'));
          return;
        }

        this.websocket.onopen = () => {
          console.log('✅ WebSocket connected to ElevenLabs Conversational AI');
          this.isConnected = true;
          this.emit('websocket-connected');
          
          // Send conversation initiation
          this.sendWSMessage({
            type: 'conversation_initiation_client_data'
          });
          
          // Start streaming audio from microphone
          this.startAudioStreaming();
          resolve(undefined);
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.websocket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.emit('websocket-disconnected', { code: event.code, reason: event.reason });
          
          if (this.isCallActive) {
            this.stop();
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.emit('error', { error: 'WebSocket connection error' });
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      throw error;
    }
  }

  /**
   * Send message to WebSocket
   */
  private sendWSMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Start streaming audio from microphone to ElevenLabs
   */
  private startAudioStreaming(): void {
    if (!this.audioContext || !this.mediaStream || !this.websocket) {
      console.error('❌ Audio streaming prerequisites not met');
      return;
    }

    try {
      console.log('🎤 Starting audio streaming to ElevenLabs...');

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.audioProcessor.onaudioprocess = (e) => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert float32 to int16 PCM
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          // Convert to base64 and send
          const uint8Array = new Uint8Array(pcmData.buffer);
          const base64Audio = btoa(String.fromCharCode(...uint8Array));
          
          this.sendWSMessage({
            user_audio_chunk: base64Audio
          });
        }
      };

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      console.log('✅ Audio streaming started');

    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error);
    }
  }

  /**
   * Handle incoming WebSocket messages from ElevenLabs
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received message from ElevenLabs:', data.type, data);

      switch (data.type) {
        case 'conversation_initiation_metadata':
          this.currentConversationId = data.conversation_initiation_metadata_event?.conversation_id || '';
          console.log('🎯 Conversation initiated:', this.currentConversationId);
          break;

        case 'user_transcript':
          this.emit('user-speech', {
            message: data.user_transcription_event?.user_transcript || '',
            time_in_call_secs: Math.floor((Date.now() - this.callStartTime) / 1000)
          });
          break;

        case 'agent_response':
          this.emit('message', {
            role: 'agent',
            message: data.agent_response_event?.agent_response || '',
            time_in_call_secs: Math.floor((Date.now() - this.callStartTime) / 1000)
          });
          break;

        case 'audio':
          this.playAudioResponse(data.audio_event?.audio_base_64);
          break;

        case 'ping':
          // Respond to ping to keep connection alive
          const pingMs = data.ping_event?.ping_ms || 0;
          setTimeout(() => {
            this.sendWSMessage({
              type: 'pong',
              event_id: data.ping_event?.event_id
            });
          }, pingMs);
          break;

        case 'interruption':
          console.log('🚫 User interrupted AI');
          this.emit('user-interrupted');
          break;

        case 'vad_score':
          // Voice activity detection score
          break;

        default:
          console.log('📝 Unhandled message type:', data.type, data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Play audio response from AI agent
   */
  private playAudioResponse(audioBase64: string): void {
    if (!this.audioContext || !audioBase64) return;

    try {
      // Decode base64 to binary
      const binaryString = atob(audioBase64);
      const audioData = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }

      // ElevenLabs sends raw PCM data, so we need to create AudioBuffer manually
      // PCM 16-bit samples at 16kHz (2 bytes per sample)
      const sampleRate = 16000;
      const numSamples = audioData.length / 2; // 16-bit = 2 bytes per sample
      
      // Create AudioBuffer
      const audioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Convert int16 PCM to float32 for Web Audio API
      const dataView = new DataView(audioData.buffer);
      for (let i = 0; i < numSamples; i++) {
        // Read 16-bit signed integer (little-endian)
        const sample = dataView.getInt16(i * 2, true);
        // Convert to float32 (-1.0 to 1.0)
        channelData[i] = sample / 32768.0;
      }
      
      // Add to playback queue
      this.audioQueue.push(audioBuffer);
      this.playNextAudio();

    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  }

  /**
   * Play the next audio in queue
   */
  private playNextAudio(): void {
    if (this.isPlayingAudio || this.audioQueue.length === 0 || !this.audioContext) {
      return;
    }

    this.isPlayingAudio = true;
    const buffer = this.audioQueue.shift()!;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.isPlayingAudio = false;
      this.playNextAudio(); // Play next audio in queue
    };
    
    source.start();
    this.emit('speech-start');
  }

  /**
   * Stop the conversation
   */
  stop(): void {
    console.log('⏹️ Stopping ElevenLabs Conversational AI session');
    
    this.isCallActive = false;
    this.isConnected = false;
    
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.audioQueue = [];
    this.isPlayingAudio = false;

    this.emit('call-end');
  }

  /**
   * Event listener management
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any = {}): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Utility methods
   */
  isActive(): boolean {
    return this.isCallActive && this.isConnected;
  }

  getCurrentConversationId(): string {
    return this.currentConversationId;
  }

  getCurrentAgentId(): string {
    return this.currentAgentId;
  }

  // Compatibility methods for existing interface
  sendMessage(message: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.sendWSMessage({
        type: 'user_message',
        text: message
      });
    }
  }

  setMuted(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  isMuted(): boolean {
    if (this.mediaStream) {
      return !this.mediaStream.getAudioTracks().some(track => track.enabled);
    }
    return false;
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

// Utility functions for environment configuration
const getElevenLabsApiKey = (): string => {
  // For Vite applications, check if we're in a browser environment with import.meta.env
  if (typeof window !== 'undefined' && import.meta && import.meta.env) {
    return import.meta.env.VITE_ELEVENLABS_API_KEY ||
           import.meta.env.ELEVENLABS_API_KEY ||
           import.meta.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ||
           '';
  }
  
  // Fallback for Node.js/server environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env.ELEVENLABS_API_KEY ||
           process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ||
           process.env.VITE_ELEVENLABS_API_KEY ||
           process.env.REACT_APP_ELEVENLABS_API_KEY ||
           '';
  }
  
  return '';
};

const isElevenLabsConfigured = (): boolean => {
  const apiKey = getElevenLabsApiKey();
  const isValidKey = !!(apiKey && 
                       !apiKey.includes('your_') && 
                       !apiKey.includes('placeholder') && 
                       !apiKey.includes('demo') &&
                       apiKey.length > 10);
  
  if (isValidKey) {
    console.log('🎤 ElevenLabs Conversational AI: Production mode with API key');
  } else {
    console.error('❌ ElevenLabs Conversational AI: No valid API key found!');
    console.error('Please set ELEVENLABS_API_KEY in your .env file');
  }
  
  return isValidKey;
};

// Initialize the ElevenLabs Conversational AI client
const initializeConversationalAI = () => {
  const apiKey = getElevenLabsApiKey();
  
  if (!isElevenLabsConfigured()) {
    throw new Error(`
❌ ElevenLabs Conversational AI requires a valid API key!

Please add your API key to .env file:
ELEVENLABS_API_KEY=your_actual_api_key_here

Demo mode is not supported for Conversational AI.
    `);
  }

  console.log('🚀 Initializing production ElevenLabs Conversational AI');
  return new ElevenLabsConversationalAI(apiKey);
};

// Export the client instance
let conversationalAI: ElevenLabsConversationalAI;

try {
  conversationalAI = initializeConversationalAI();
} catch (error) {
  console.error('Failed to initialize ElevenLabs Conversational AI:', error);
  throw error;
}

// Export configuration status
export const getConversationalAIConfig = () => {
  return {
    isConfigured: isElevenLabsConfigured(),
    mode: 'production',
    hasApiKey: !!getElevenLabsApiKey(),
    service: 'ElevenLabs Conversational AI',
    timestamp: new Date().toISOString()
  };
};

export { 
  ElevenLabsConversationalAI,
  isElevenLabsConfigured, 
  getElevenLabsApiKey,
  CONVERSATIONAL_AI_AGENTS
};

export { conversationalAI };
export default conversationalAI; 