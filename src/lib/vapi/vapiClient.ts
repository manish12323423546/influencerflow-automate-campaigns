"use client";

import Vapi from "@vapi-ai/web";
import { getElevenLabsService, ELEVENLABS_VOICES } from "@/lib/elevenlabs";

// Environment variable detection with multiple formats
const getVapiKey = () => {
  return process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ||
         process.env.NEXT_PUBLIC_VAPI_API_KEY ||
         process.env.VITE_VAPI_PUBLIC_KEY ||
         process.env.VITE_VAPI_API_KEY ||
         '';
};

// Check if we should use demo mode
const isDemoMode = () => {
  const vapiKey = getVapiKey();
  return !vapiKey || 
         vapiKey.includes('demo') || 
         vapiKey.includes('placeholder') ||
         vapiKey.length < 10; // Real VAPI keys are longer
};

// Enhanced Demo VAPI client with ElevenLabs v3 integration
class DemoVapi {
  private eventListeners: Map<string, Function[]> = new Map();
  private isCallActive: boolean = false;
  private callStartTime: number = 0;
  private elevenLabsService: any;
  private currentAudio: HTMLAudioElement | null = null;
  private isSpeaking: boolean = false;

  constructor() {
    // Initialize ElevenLabs service
    this.elevenLabsService = getElevenLabsService();
    
    if (this.elevenLabsService) {
      console.log('✅ Demo VAPI: ElevenLabs v3 service initialized successfully');
    } else {
      console.log('🎭 Demo VAPI: ElevenLabs not configured, falling back to browser speech synthesis');
    }
  }

  async start(assistantId: string) {
    console.log('🎭 Demo VAPI: Starting call with assistant:', assistantId);
    
    if (this.isCallActive) {
      console.warn('🎭 Demo VAPI: Call already active');
      return { success: false, error: 'Call already active' };
    }
    
    this.isCallActive = true;
    this.callStartTime = Date.now();
    
    // Simulate connection delay
    setTimeout(() => {
      this.emit('call-start', { assistantId });
      
      // Simulate AI greeting after connection with ElevenLabs
      setTimeout(() => {
        this.speakMessage("Hello! I'm your AI assistant powered by ElevenLabs voice technology. I'm ready to help you with your campaign needs. What would you like to discuss today?");
      }, 1000);
    }, 1000);
    
    return { success: true };
  }

  stop() {
    console.log('🎭 Demo VAPI: Stopping call');
    
    if (!this.isCallActive) {
      console.warn('🎭 Demo VAPI: No active call to stop');
      return { success: false, error: 'No active call' };
    }
    
    // Stop any ongoing speech
    this.stopSpeaking();
    
    this.isCallActive = false;
    this.emit('call-end', { 
      duration: Date.now() - this.callStartTime,
      endedAt: new Date().toISOString()
    });
    return { success: true };
  }

  private async speakMessage(message: string) {
    if (!this.isCallActive || this.isSpeaking) return;

    console.log('🗣️ Demo VAPI: Speaking message with ElevenLabs:', message);
    
    this.isSpeaking = true;
    this.emit('speech-start');

    try {
      if (this.elevenLabsService) {
        // Use ElevenLabs v3 for high-quality AI voice
        console.log('🎭 Using ElevenLabs v3 for speech synthesis...');
        
        const audioData = await this.elevenLabsService.generateSpeech(message, {
          voiceId: ELEVENLABS_VOICES.BRAND_REP, // Professional female voice
          stability: 0.5,       // Balanced stability
          similarityBoost: 0.75, // High similarity
          style: 0.2,           // Slight style for AI personality
          useSpeakerBoost: true  // Enhanced clarity
        });

        // Play the audio
        this.currentAudio = await this.elevenLabsService.playAudio(
          audioData,
          () => {
            console.log('🗣️ ElevenLabs: AI started speaking');
            // speech-start already emitted above
          },
          () => {
            console.log('🤐 ElevenLabs: AI finished speaking');
            this.isSpeaking = false;
            this.currentAudio = null;
            this.emit('speech-end');
            this.emit('message', { 
              message: message,
              timestamp: Date.now() - this.callStartTime,
              synthesizer: 'elevenlabs-v3'
            });
          },
          (error) => {
            console.error('🔴 ElevenLabs: Audio playback error:', error);
            this.isSpeaking = false;
            this.currentAudio = null;
            this.emit('speech-end');
            this.emit('message', { 
              message: message,
              timestamp: Date.now() - this.callStartTime,
              synthesizer: 'elevenlabs-v3',
              error: error.message
            });
          }
        );

      } else {
        // Fallback to browser speech synthesis
        console.log('🎭 Falling back to browser speech synthesis...');
        await this.speakWithBrowserTTS(message);
      }
    } catch (error) {
      console.error('🔴 Demo VAPI: Speech synthesis failed:', error);
      this.isSpeaking = false;
      
      // Try fallback to browser TTS
      try {
        await this.speakWithBrowserTTS(message);
      } catch (fallbackError) {
        console.error('🔴 Demo VAPI: Both ElevenLabs and browser TTS failed:', fallbackError);
        this.emit('speech-end');
        this.emit('message', { 
          message: message,
          timestamp: Date.now() - this.callStartTime,
          error: 'Speech synthesis failed'
        });
      }
    }
  }

  private async speakWithBrowserTTS(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(message);
      
      // Configure voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('samantha') || 
        voice.name.toLowerCase().includes('alex') || 
        voice.lang.includes('en-US')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      
      utterance.onstart = () => {
        console.log('🗣️ Browser TTS: Started speaking');
      };
      
      utterance.onend = () => {
        console.log('🤐 Browser TTS: Finished speaking');
        this.isSpeaking = false;
        this.emit('speech-end');
        this.emit('message', { 
          message: message,
          timestamp: Date.now() - this.callStartTime,
          synthesizer: 'browser-tts'
        });
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🔴 Browser TTS: Error:', event);
        this.isSpeaking = false;
        this.emit('speech-end');
        reject(new Error('Browser TTS failed'));
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }

  private stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    this.isSpeaking = false;
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
    console.log(`🎭 Demo VAPI: Registered listener for ${event}`);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
        console.log(`🎭 Demo VAPI: Removed listener for ${event}`);
      }
    }
  }

  // Simulate user interaction with ElevenLabs responses
  sendTestMessage(message: string) {
    if (!this.isCallActive) {
      console.warn('🎭 Demo VAPI: Cannot send message - no active call');
      return;
    }
    
    // Generate contextual responses for different campaign scenarios
    const responses = [
      "Excellent! Let me share some insights about campaign strategy. Based on current market trends, I recommend focusing on authentic storytelling and micro-influencer partnerships for maximum engagement.",
      "That's a fantastic approach! For influencer outreach, I suggest creating personalized partnership proposals that highlight mutual value. Would you like me to help you identify the best creators for your target audience?",
      "Absolutely spot-on! The data shows that campaigns with clear brand alignment perform 40% better. Let me walk you through our proven framework for measuring campaign ROI and optimizing performance metrics.",
      "Great question! From my analysis, the most successful campaigns combine emotional storytelling with strategic timing. I'd recommend launching during peak engagement windows for your specific demographic.",
      "Perfect timing to discuss this! Our latest campaign analytics show that authentic partnerships drive 3x higher conversion rates. Should we explore some targeting strategies that could maximize your campaign impact?"
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Speak the response with a natural delay
    setTimeout(() => {
      this.speakMessage(response);
    }, 1000);
  }

  // Get current call status
  getCallStatus() {
    return {
      isActive: this.isCallActive,
      duration: this.isCallActive ? Date.now() - this.callStartTime : 0,
      startTime: this.callStartTime,
      isSpeaking: this.isSpeaking,
      synthesizer: this.elevenLabsService ? 'elevenlabs-v3' : 'browser-tts'
    };
  }

  private emit(event: string, data: any = {}) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🎭 Demo VAPI: Error in ${event} listener:`, error);
        }
      });
    }
    console.log(`🎭 Demo VAPI: Emitted ${event}`, data);
  }
}

// Production VAPI client wrapper
class ProductionVapi {
  private vapiInstance: any;
  private vapiKey: string;

  constructor(apiKey: string) {
    this.vapiKey = apiKey;
    try {
      this.vapiInstance = new Vapi(apiKey);
      console.log('🚀 Production VAPI: Initialized successfully');
    } catch (error) {
      console.error('❌ Production VAPI: Failed to initialize:', error);
      throw error;
    }
  }

  async start(assistantId: string) {
    try {
      console.log('🚀 Production VAPI: Starting call with assistant:', assistantId);
      const result = await this.vapiInstance.start(assistantId);
      console.log('✅ Production VAPI: Call started successfully');
      return result;
    } catch (error) {
      console.error('❌ Production VAPI: Failed to start call:', error);
      throw error;
    }
  }

  stop() {
    try {
      console.log('🚀 Production VAPI: Stopping call');
      const result = this.vapiInstance.stop();
      console.log('✅ Production VAPI: Call stopped successfully');
      return result;
    } catch (error) {
      console.error('❌ Production VAPI: Failed to stop call:', error);
      throw error;
    }
  }

  on(event: string, callback: Function) {
    this.vapiInstance.on(event, callback);
  }

  off(event: string, callback: Function) {
    this.vapiInstance.off(event, callback);
  }

  // Expose additional methods if needed
  setMuted(muted: boolean) {
    if (this.vapiInstance.setMuted) {
      this.vapiInstance.setMuted(muted);
    }
  }
}

// Initialize VAPI client based on environment
const initializeVapiClient = () => {
  const vapiKey = getVapiKey();
  
  console.log('🔧 VAPI Client Configuration:', {
    hasVapiKey: !!vapiKey,
    vapiKeyLength: vapiKey?.length || 0,
    isDemoMode: isDemoMode(),
    keyPreview: vapiKey ? `${vapiKey.substring(0, 8)}...` : 'none',
    timestamp: new Date().toISOString()
  });
  
  if (isDemoMode()) {
    console.log('🎭 Using Demo VAPI Client (no valid API key found)');
    return new DemoVapi();
  }
  
  try {
    console.log('🚀 Initializing Production VAPI client...');
    return new ProductionVapi(vapiKey);
  } catch (error) {
    console.error('❌ Failed to initialize Production VAPI client:', error);
    console.log('🎭 Falling back to Demo VAPI Client');
    return new DemoVapi();
  }
};

// Export the VAPI client instance
export const vapi = initializeVapiClient();
export { isDemoMode, getVapiKey };

// Export configuration status
export const vapiClientConfig = {
  isDemoMode: isDemoMode(),
  hasApiKey: !!getVapiKey(),
  apiKeyLength: getVapiKey()?.length || 0
};

// Default export for compatibility
export default vapi; 