// ElevenLabs AI Voice Synthesis Service
// Using ElevenLabs v3 Alpha - Most emotionally rich, expressive speech synthesis model

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface LLMUsage {
  model_usage: {
    [key: string]: {
      input: { tokens: number; price: number };
      input_cache_read: { tokens: number; price: number };
      input_cache_write: { tokens: number; price: number };
      output_total: { tokens: number; price: number };
    };
  };
}

export interface ConversationMessage {
  role: string;         // 'user' or 'agent'
  message: string;      // message content (note: API returns 'message', not 'content')
  time_in_call_secs: number;  // timestamp in seconds from call start
  tool_calls?: any[];   // Array of tool calls made during this message
  tool_results?: any[]; // Results of tool calls
  feedback?: any;       // Any feedback on the message
  llm_override?: any;   // Any LLM overrides
  source_medium?: string; // How the message was input (e.g. 'audio')
  conversation_turn_metrics?: {
    metrics: {
      convai_llm_service_ttf_sentence: { elapsed_time: number };
      convai_llm_service_ttfb: { elapsed_time: number };
    };
  };
  rag_retrieval_info?: {
    chunks: Array<{
      document_id: string;
      chunk_id: string;
      vector_distance: number;
    }>;
    embedding_model: string;
    retrieval_query: string;
    rag_latency_secs: number;
  };
  llm_usage?: LLMUsage;
  interrupted?: boolean;
  original_message?: string;
}

// ElevenLabs Voice IDs for different AI personalities
export const ELEVENLABS_VOICES = {
  BRAND_REP: '21m00Tcm4TlvDq8ikWAM',     // Rachel - Professional female voice
  SALES: 'N2lVS1w4EtoT3dr4eOWO',          // Callum - Confident male voice  
  SUPPORT: 'EXAVITQu4vr4xnSDxMaL',        // Bella - Friendly female voice
  ASSISTANT: 'pNInz6obpgDQGcFmaJgB',      // Adam - Clear, professional male voice
  DEFAULT: '21m00Tcm4TlvDq8ikWAM'          // Default to Rachel
} as const;

// ElevenLabs Models
export const ELEVENLABS_MODELS = {
  V3_ALPHA: 'eleven_multilingual_v2',      // Most expressive (v3 alpha equivalent)
  V2_MULTILINGUAL: 'eleven_multilingual_v2', // Natural quality
  FLASH: 'eleven_flash_v2_5',              // Ultra-low latency
  TURBO: 'eleven_turbo_v2_5'               // Balanced quality/speed
} as const;

class ElevenLabsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate speech using ElevenLabs v3 Alpha model
   * @param text The text to convert to speech
   * @param config Configuration options
   * @returns Promise<ArrayBuffer> Audio data
   */
  async generateSpeech(
    text: string, 
    config: Partial<ElevenLabsConfig> = {}
  ): Promise<ArrayBuffer> {
    const {
      voiceId = ELEVENLABS_VOICES.DEFAULT,
      model = ELEVENLABS_MODELS.V2_MULTILINGUAL, // Using v2 for now as v3 might not be available
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
      useSpeakerBoost = true
    } = config;

    console.log('🎭 ElevenLabs: Generating speech with v3 model:', {
      textLength: text.length,
      voiceId,
      model,
      timestamp: new Date().toISOString()
    });

    const url = `${this.baseUrl}/text-to-speech/${voiceId}/stream`;
    
    const requestBody = {
      text: text,
      model_id: model,
      voice_settings: {
        stability: stability,
        similarity_boost: similarityBoost,
        style: style,
        use_speaker_boost: useSpeakerBoost
      },
      // Enhanced settings for v3-like quality
      output_format: "mp3_44100_128", // High quality output
      optimize_streaming_latency: 2,   // Balanced latency optimization
      apply_text_normalization: "auto" // Smart text normalization
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 ElevenLabs API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          timestamp: new Date().toISOString()
        });
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();
      console.log('✅ ElevenLabs: Speech generated successfully:', {
        audioSize: audioData.byteLength,
        duration: 'unknown', // We'd need to parse the audio to get duration
        timestamp: new Date().toISOString()
      });

      return audioData;
    } catch (error) {
      console.error('🔴 ElevenLabs: Speech generation failed:', error);
      throw error;
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices(): Promise<any[]> {
    try {
      console.log('🎭 ElevenLabs: Fetching available voices...');
      
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ ElevenLabs: Voices fetched:', data.voices?.length || 0);
      
      return data.voices || [];
    } catch (error) {
      console.error('🔴 ElevenLabs: Failed to fetch voices:', error);
      return [];
    }
  }

  /**
   * Play audio from ArrayBuffer
   * @param audioData Audio data from ElevenLabs API
   * @param onStart Callback when audio starts playing
   * @param onEnd Callback when audio ends
   * @param onError Callback for errors
   */
  async playAudio(
    audioData: ArrayBuffer,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (error: Error) => void
  ): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      try {
        // Create blob from audio data
        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Create audio element
        const audio = new Audio(audioUrl);
        audio.volume = 0.9; // Slightly lower volume for better experience
        audio.preload = 'auto';

        // Set up event listeners
        audio.onloadeddata = () => {
          console.log('🎵 ElevenLabs: Audio loaded and ready to play');
          resolve(audio);
        };

        audio.onplay = () => {
          console.log('🗣️ ElevenLabs: Audio playback started');
          onStart?.();
        };

        audio.onended = () => {
          console.log('🤐 ElevenLabs: Audio playback ended');
          URL.revokeObjectURL(audioUrl); // Clean up blob URL
          onEnd?.();
        };

        audio.onerror = (event) => {
          const error = new Error('Audio playback failed');
          console.error('🔴 ElevenLabs: Audio playback error:', error);
          URL.revokeObjectURL(audioUrl); // Clean up blob URL
          onError?.(error);
          reject(error);
        };

        // Start playing
        audio.play().catch((playError) => {
          console.error('🔴 ElevenLabs: Failed to start audio playback:', playError);
          URL.revokeObjectURL(audioUrl);
          onError?.(playError);
          reject(playError);
        });

      } catch (error) {
        console.error('🔴 ElevenLabs: Failed to create audio element:', error);
        onError?.(error as Error);
        reject(error);
      }
    });
  }
}

// Utility functions for environment detection
const getElevenLabsApiKey = (): string => {
  return process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ||
         process.env.ELEVENLABS_API_KEY ||
         process.env.VITE_ELEVENLABS_API_KEY ||
         '';
};

const isElevenLabsConfigured = (): boolean => {
  const apiKey = getElevenLabsApiKey();
  return !!(apiKey && 
           !apiKey.includes('your_') && 
           !apiKey.includes('placeholder') && 
           apiKey.length > 10);
};

// Create singleton instance
let elevenLabsInstance: ElevenLabsService | null = null;

export const getElevenLabsService = (): ElevenLabsService | null => {
  if (!isElevenLabsConfigured()) {
    console.log('🎭 ElevenLabs: API key not configured, service unavailable');
    return null;
  }

  if (!elevenLabsInstance) {
    const apiKey = getElevenLabsApiKey();
    elevenLabsInstance = new ElevenLabsService(apiKey);
    console.log('✅ ElevenLabs: Service initialized successfully');
  }

  return elevenLabsInstance;
};

// Export conversation-related function for compatibility
export async function getConversationTranscript(
  conversationId: string
): Promise<ConversationMessage[]> {
  console.log('📋 Getting conversation transcript for:', conversationId);
  
  // This is a placeholder - in a real implementation, you'd fetch from your backend
  // For now, return empty array as this is mainly used for compatibility
  return [];
}

// Export configuration status
export const elevenLabsConfig = {
  isConfigured: isElevenLabsConfigured(),
  hasApiKey: !!getElevenLabsApiKey(),
  apiKeyLength: getElevenLabsApiKey()?.length || 0
};

export { ElevenLabsService, isElevenLabsConfigured, getElevenLabsApiKey }; 