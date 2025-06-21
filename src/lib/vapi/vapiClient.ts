"use client";

import { conversationalAI, getConversationalAIConfig, CONVERSATIONAL_AI_AGENTS } from '@/lib/elevenlabs-conversational-ai';

// Production-only VAPI client using ElevenLabs Conversational AI
class ConversationalAIClient {
  private conversationalAI: any;
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private isCallActive: boolean = false;
  private currentAgentId: string = '';

  constructor() {
    this.conversationalAI = conversationalAI;
    this.setupEventForwarding();
    console.log('🎤 ConversationalAI client initialized (Production Only)');
  }

  private setupEventForwarding() {
    // Forward events from the conversational AI service to match VAPI interface
    this.conversationalAI.on('call-start', (data: any) => {
      this.isCallActive = true;
      console.log('🚀 ElevenLabs Conversational AI call started');
      this.emit('call-start', data);
    });

    this.conversationalAI.on('call-end', (data: any) => {
      this.isCallActive = false;
      console.log('⏹️ ElevenLabs Conversational AI call ended');
      this.emit('call-end', data);
    });

    this.conversationalAI.on('speech-start', (data: any) => {
      console.log('🗣️ ElevenLabs AI agent started speaking');
      this.emit('speech-start', data);
    });

    this.conversationalAI.on('speech-end', (data: any) => {
      console.log('🤐 ElevenLabs AI agent stopped speaking');
      this.emit('speech-end', data);
    });

    this.conversationalAI.on('message', (data: any) => {
      console.log('💬 ElevenLabs AI agent message:', data);
      this.emit('message', data);
    });

    this.conversationalAI.on('user-speech', (data: any) => {
      console.log('🎤 User speech detected:', data);
      this.emit('message', {
        role: 'user',
        message: data.message,
        time_in_call_secs: data.time_in_call_secs
      });
    });

    this.conversationalAI.on('error', (data: any) => {
      console.error('❌ ElevenLabs Conversational AI error:', data);
      this.emit('error', data);
    });

    this.conversationalAI.on('call-duration-update', (data: any) => {
      this.emit('call-duration-update', data);
    });

    this.conversationalAI.on('websocket-connected', () => {
      console.log('✅ Connected to ElevenLabs WebSocket');
    });

    this.conversationalAI.on('websocket-disconnected', (data: any) => {
      console.log('🔌 Disconnected from ElevenLabs WebSocket:', data);
    });
  }

  async start(agentId: string, options: any = {}) {
    try {
      this.currentAgentId = agentId;
      console.log('🚀 Starting ElevenLabs Conversational AI call:', {
        agentId,
        targetAgent: CONVERSATIONAL_AI_AGENTS.DEFAULT,
        timestamp: new Date().toISOString()
      });
      
      // Always use your specific agent ID
      const targetAgentId = CONVERSATIONAL_AI_AGENTS.DEFAULT;
      
      await this.conversationalAI.start(targetAgentId);
      
      console.log('✅ ElevenLabs Conversational AI call started successfully');
    } catch (error) {
      console.error('❌ Failed to start ElevenLabs Conversational AI call:', error);
      this.emit('error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  stop() {
    try {
      console.log('⏹️ Stopping ElevenLabs Conversational AI call');
      this.conversationalAI.stop();
      this.isCallActive = false;
    } catch (error) {
      console.error('❌ Failed to stop ElevenLabs Conversational AI call:', error);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  setMuted(muted: boolean) {
    this.conversationalAI.setMuted(muted);
    console.log(`🎤 Microphone ${muted ? 'muted' : 'unmuted'}`);
    this.emit('mute-changed', { muted });
  }

  isMuted() {
    return this.conversationalAI.isMuted();
  }

  sendTestMessage(message: string) {
    console.log('📝 Test message (voice mode - not supported):', message);
  }

  restartListening() {
    console.log('🔄 Restart listening (handled automatically by ElevenLabs)');
    this.emit('listening-restarted');
  }

  private emit(event: string, data: any = {}) {
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

  // Utility methods
  isConnected(): boolean {
    return this.conversationalAI.isConnected();
  }

  getCurrentConversationId(): string {
    return this.conversationalAI.getCurrentConversationId();
  }

  getCurrentAgentId(): string {
    return this.currentAgentId;
  }
}

// Initialize the production client
const initializeVapiClient = () => {
  console.log('🚀 Initializing ElevenLabs Conversational AI client (Production Only)');
  return new ConversationalAIClient();
};

// Export the client instance
export const vapi = initializeVapiClient();

// Export configuration status
export const getVapiClientConfig = () => {
  const config = getConversationalAIConfig();
  return {
    isConfigured: config.isConfigured,
    mode: config.mode,
    hasApiKey: config.hasApiKey,
    service: 'ElevenLabs Conversational AI',
    agentId: CONVERSATIONAL_AI_AGENTS.DEFAULT,
    timestamp: new Date().toISOString()
  };
};

// Export for compatibility
export const isDemoMode = () => {
  return false; // No demo mode supported
};

// Export the client class
export { ConversationalAIClient };
export default vapi; 