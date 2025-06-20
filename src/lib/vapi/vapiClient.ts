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

// Enhanced Demo VAPI client with ElevenLabs v3 integration and Speech Recognition
class DemoVapi {
  private eventListeners: Map<string, Function[]> = new Map();
  private isCallActive: boolean = false;
  private callStartTime: number = 0;
  private elevenLabsService: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechRecognition: any = null;
  private isListening: boolean = false;
  private conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [];
  private isSpeaking: boolean = false;
  private currentAssistantId: string = '';

  constructor() {
    this.initializeSpeechRecognition();
    this.setupElevenLabs();
  }

  private initializeSpeechRecognition() {
    // Initialize Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
      
      this.speechRecognition.onstart = () => {
        console.log('🎧 Speech recognition started');
        this.isListening = true;
      };
      
      this.speechRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          console.log('🗣️ User said:', finalTranscript);
          this.handleUserSpeech(finalTranscript.trim());
        }
      };
      
      this.speechRecognition.onerror = (event: any) => {
        console.error('🚨 Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart listening after a pause
          setTimeout(() => {
            if (this.isCallActive && !this.isSpeaking) {
              this.startListening();
            }
          }, 1000);
        }
      };
      
      this.speechRecognition.onend = () => {
        console.log('🔇 Speech recognition ended');
        this.isListening = false;
        
        // Auto-restart if call is still active and AI is not speaking
        if (this.isCallActive && !this.isSpeaking) {
          setTimeout(() => {
            this.startListening();
          }, 500);
        }
      };
    } else {
      console.warn('🚨 Speech recognition not supported in this browser');
    }
  }

  private async setupElevenLabs() {
    try {
      this.elevenLabsService = getElevenLabsService();
      console.log('🎭 Demo VAPI: ElevenLabs service configured');
    } catch (error) {
      console.log('🎭 Demo VAPI: ElevenLabs not configured, falling back to browser speech synthesis');
    }
  }

  private async handleUserSpeech(userText: string) {
    if (!this.isCallActive || this.isSpeaking) return;
    
    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', content: userText });
    
    // Emit user message event
    this.emit('user-speech', { 
      message: userText, 
      timestamp: Date.now() - this.callStartTime,
      type: 'user-speech'
    });
    
    // Generate AI response
    const aiResponse = await this.generateAIResponse(userText);
    
    if (aiResponse) {
      // Add AI response to conversation history
      this.conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      // Stop listening while AI speaks
      this.stopListening();
      
      // Emit speech start
      this.emit('speech-start', {});
      
      // Speak AI response
      await this.speakMessage(aiResponse);
      
      // Emit message
      this.emit('message', { 
        message: aiResponse, 
        timestamp: Date.now() - this.callStartTime,
        synthesizer: this.elevenLabsService ? 'elevenlabs' : 'browser-tts'
      });
    }
  }

  private async generateAIResponse(userInput: string): Promise<string> {
    // Simple AI response logic based on user input
    const input = userInput.toLowerCase();
    
    // Context-aware responses based on conversation history
    const responses = [
      // Campaign-related responses
      {
        keywords: ['campaign', 'marketing', 'strategy', 'promote'],
        responses: [
          "Great question about campaigns! I can help you create effective marketing strategies. What type of campaign are you planning?",
          "For successful campaigns, I recommend focusing on your target audience first. Tell me more about who you're trying to reach.",
          "Campaign strategy is crucial for success. Are you looking to increase brand awareness, generate leads, or drive sales?"
        ]
      },
      
      // Influencer-related responses
      {
        keywords: ['influencer', 'creator', 'collaboration', 'partnership'],
        responses: [
          "Influencer partnerships can be very powerful! What industry or niche are you targeting for your influencer campaigns?",
          "I can help you find the right creators for your brand. What's your budget range and campaign goals?",
          "Creator collaborations work best when there's authentic alignment. What values does your brand represent?"
        ]
      },
      
      // Budget and ROI responses
      {
        keywords: ['budget', 'cost', 'price', 'roi', 'return'],
        responses: [
          "Budget planning is essential for campaign success. What's your target ROI, and what's your available budget range?",
          "Let's discuss your budget allocation. How much are you planning to invest in this campaign?",
          "ROI tracking helps optimize campaigns. What metrics are most important for measuring your success?"
        ]
      },
      
      // General conversation
      {
        keywords: ['hello', 'hi', 'hey', 'start', 'begin'],
        responses: [
          "Hello! I'm excited to help you with your campaign strategy. What specific goals do you have in mind?",
          "Hi there! I'm here to assist with your marketing campaigns. What type of project are you working on?",
          "Great to connect! Let's dive into your campaign needs. What's your main objective?"
        ]
      },
      
      // Questions and help
      {
        keywords: ['help', 'how', 'what', 'why', 'when', 'where'],
        responses: [
          "I'm here to help! Can you tell me more specifically what you'd like assistance with?",
          "That's a great question. Let me provide some guidance based on your specific situation.",
          "I'd be happy to explain that further. What aspect would you like me to focus on?"
        ]
      }
    ];

    // Find matching response category
    for (const category of responses) {
      if (category.keywords.some(keyword => input.includes(keyword))) {
        const randomResponse = category.responses[Math.floor(Math.random() * category.responses.length)];
        return randomResponse;
      }
    }

    // Default responses for unmatched input
    const defaultResponses = [
      "That's interesting! Can you tell me more about what you're looking to achieve?",
      "I understand. How can I best assist you with your campaign objectives?",
      "Thanks for sharing that. What specific outcomes are you hoping for?",
      "Good point! Let's explore how we can make that work for your brand.",
      "I see what you mean. What's the next step you'd like to take?",
      "That's a great perspective. How does that fit into your overall strategy?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  private startListening() {
    if (this.speechRecognition && !this.isListening && !this.isSpeaking) {
      try {
        this.speechRecognition.start();
        console.log('🎧 Started listening for user speech');
      } catch (error) {
        console.log('🎧 Speech recognition already active');
      }
    }
  }

  private stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      console.log('🔇 Stopped listening for user speech');
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
    this.currentAssistantId = assistantId;
    this.conversationHistory = [];
    
    // Start with AI greeting
    setTimeout(async () => {
      if (this.isCallActive) {
        this.emit('call-start', { assistantId });
        
        // AI greeting message
        const greeting = this.getPersonalizedGreeting(assistantId);
        
        this.emit('speech-start', {});
        await this.speakMessage(greeting);
        this.emit('message', { 
          message: greeting, 
          timestamp: Date.now() - this.callStartTime,
          synthesizer: this.elevenLabsService ? 'elevenlabs' : 'browser-tts'
        });
        
        // Start listening for user speech after greeting
        setTimeout(() => {
          if (this.isCallActive) {
            this.startListening();
          }
        }, 1000);
      }
    }, 2000);
    
    return { success: true };
  }

  private getPersonalizedGreeting(assistantId: string): string {
    const greetings = [
      "Hello! I'm your AI assistant powered by ElevenLabs voice technology. I'm ready to help you with your campaign needs. What would you like to discuss today?",
      "Hi there! I'm excited to work with you on your marketing campaigns. What specific goals do you have in mind?",
      "Welcome! I'm here to help you create successful influencer campaigns. What type of project are you planning?",
      "Great to connect! I'm your campaign strategy assistant. How can I help you achieve your marketing objectives today?"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
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
        this.currentUtterance = await this.elevenLabsService.playAudio(
          audioData,
          () => {
            console.log('🗣️ ElevenLabs: AI started speaking');
            // speech-start already emitted above
          },
          () => {
            console.log('🤐 ElevenLabs: AI finished speaking');
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.emit('speech-end');
            this.emit('message', { 
              message: message,
              timestamp: Date.now() - this.callStartTime,
              synthesizer: 'elevenlabs'
            });
          },
          (error) => {
            console.error('🔴 ElevenLabs: Audio playback error:', error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.emit('speech-end');
            this.emit('message', { 
              message: message,
              timestamp: Date.now() - this.callStartTime,
              synthesizer: 'elevenlabs',
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
    // Stop ElevenLabs audio if playing
    if (this.elevenLabsService && this.elevenLabsService.stopCurrentAudio) {
      this.elevenLabsService.stopCurrentAudio();
    }
    
    // Stop browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.currentUtterance = null;
    
    // Resume listening after stopping speech
    setTimeout(() => {
      if (this.isCallActive && !this.isSpeaking) {
        this.startListening();
      }
    }, 500);
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
      synthesizer: this.elevenLabsService ? 'elevenlabs' : 'browser-tts'
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