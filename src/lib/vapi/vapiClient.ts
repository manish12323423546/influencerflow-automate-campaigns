"use client";

import Vapi from "@vapi-ai/web";

// Check if we're in demo mode
const isDemoMode = () => {
  const key = import.meta.env?.VITE_VAPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY;
  return !key || key === 'your_vapi_public_key_here' || key === '' || key.length < 10;
};

// Get the VAPI public key
const getVapiKey = () => {
  return import.meta.env?.VITE_VAPI_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPI_API_KEY;
};

// Validate VAPI key format
const validateVapiKey = (key: string | undefined) => {
  if (!key) return { valid: false, reason: 'Key is missing' };
  if (key === 'your_vapi_public_key_here') return { valid: false, reason: 'Using placeholder key' };
  if (key.length < 10) return { valid: false, reason: 'Key is too short' };
  if (!key.startsWith('sk-') && !key.startsWith('pk-')) return { valid: false, reason: 'Key format invalid (should start with sk- or pk-)' };
  return { valid: true, reason: 'Key appears valid' };
};

const keyValidation = validateVapiKey(getVapiKey());

console.log('🤖 VAPI Client Environment Check:', {
  isDemoMode: isDemoMode(),
  hasKey: !!getVapiKey(),
  keyLength: getVapiKey()?.length || 0,
  keyValidation,
  env: import.meta.env?.MODE || 'unknown',
  timestamp: new Date().toISOString()
});

if (!keyValidation.valid) {
  console.warn('⚠️ VAPI Configuration Warning:', {
    reason: keyValidation.reason,
    solution: 'Please set VITE_VAPI_PUBLIC_KEY or NEXT_PUBLIC_VAPI_API_KEY in your .env file',
    demoMode: 'Running in demo mode instead'
  });
}

// Demo VAPI implementation for when real credentials aren't available
class DemoVapi {
  private eventListeners: Map<string, Function[]> = new Map();

  async start(assistantId: string) {
    console.log('🎭 Demo VAPI: Starting call with assistant:', assistantId);
    
    // Check if this looks like a real assistant ID vs a placeholder
    if (!assistantId || assistantId === 'your_assistant_id_here' || assistantId.length < 10) {
      console.error('🎭 Demo VAPI: Invalid assistant ID provided:', assistantId);
      throw new Error(`Demo Mode: Invalid assistant ID "${assistantId}". Please create a proper assistant first.`);
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🎭 Demo VAPI: Successfully connected to assistant (simulated)');
    
    // Trigger events to simulate real VAPI behavior
    setTimeout(() => {
      console.log('🎭 Demo VAPI: Emitting call-start event');
      this.emit('call-start', { assistantId });
    }, 500);
    
    setTimeout(() => {
      console.log('🎭 Demo VAPI: Emitting speech-start event');
      this.emit('speech-start', { role: 'assistant' });
    }, 2000);
    
    setTimeout(() => {
      console.log('🎭 Demo VAPI: Emitting speech-end event');
      this.emit('speech-end', { role: 'assistant' });
    }, 4000);
    
    return { success: true };
  }
  
  stop() {
    console.log('🎭 Demo VAPI: Stopping call');
    this.emit('call-end', {});
    return { success: true };
  }
  
  on(event: string, callback: Function) {
    console.log('🎭 Demo VAPI: Registering event listener for:', event);
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function) {
    console.log('🎭 Demo VAPI: Removing event listener for:', event);
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in VAPI event listener:', error);
        }
      });
    }
  }
}

// Initialize VAPI client
let clientInstance: Vapi | DemoVapi | null = null;

const initializeVapiClient = () => {
  if (clientInstance) {
    return clientInstance;
  }

  if (isDemoMode()) {
    console.log('🎭 Initializing Demo VAPI Client');
    clientInstance = new DemoVapi();
  } else {
    try {
      console.log('🤖 Initializing Real VAPI Client');
      clientInstance = new Vapi(getVapiKey()!);
    } catch (error) {
      console.error('Failed to create real VAPI client, falling back to demo:', error);
      clientInstance = new DemoVapi();
    }
  }

  return clientInstance;
};

// Initialize the client
const vapiClient = initializeVapiClient();

// Named exports
export { vapiClient, isDemoMode, initializeVapiClient };

// Default export
export default vapiClient; 