"use client";

import Vapi from "@vapi-ai/web";

// Check if we're in demo mode
const isDemoMode = () => {
  const vapiKey = getVapiKey();
  return !vapiKey || vapiKey.includes('demo') || vapiKey.includes('placeholder');
};

const getVapiKey = () => {
  // Try different environment variable formats
  return process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ||
         process.env.VITE_VAPI_PUBLIC_KEY ||
         process.env.NEXT_PUBLIC_VAPI_API_KEY ||
         process.env.VITE_VAPI_API_KEY ||
         '';
};

console.log('🔧 VAPI Client Configuration:', {
  hasVapiKey: !!getVapiKey(),
  vapiKeyLength: getVapiKey()?.length || 0,
  isDemoMode: isDemoMode(),
  keyPreview: getVapiKey() ? `${getVapiKey().substring(0, 8)}...` : 'none',
  timestamp: new Date().toISOString()
});

// Demo VAPI client for local development
class DemoVapi {
  private eventListeners: Map<string, Function[]> = new Map();

  async start(assistantId: string) {
    console.log('🎭 Demo VAPI: Starting call with assistant:', assistantId);
    
    // Simulate connection delay
    setTimeout(() => {
      this.emit('call-start');
      
      // Simulate AI greeting after connection
      setTimeout(() => {
        this.emit('speech-start');
        setTimeout(() => {
          this.emit('speech-end');
          this.emit('message', { 
            message: "Hello! I'm your AI meeting assistant. How can I help you today?" 
          });
        }, 2000);
      }, 1000);
    }, 1000);
    
    return { success: true };
  }

  stop() {
    console.log('🎭 Demo VAPI: Stopping call');
    this.emit('call-end');
    return { success: true };
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
      }
    }
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

// Initialize VAPI client
const initializeVapiClient = () => {
  const vapiKey = getVapiKey();
  
  if (isDemoMode()) {
    console.log('🎭 Using Demo VAPI Client (no valid API key found)');
    return new DemoVapi();
  }
  
  try {
    console.log('🚀 Initializing real VAPI client...');
    const vapiInstance = new Vapi(vapiKey);
    console.log('✅ Real VAPI client initialized successfully');
    return vapiInstance;
  } catch (error) {
    console.error('❌ Failed to initialize real VAPI client:', error);
    console.log('🎭 Falling back to Demo VAPI Client');
    return new DemoVapi();
  }
};

// Export the VAPI client instance
export const vapi = initializeVapiClient();
export { isDemoMode };

// Default export for compatibility
export default vapi; 