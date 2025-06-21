import { VapiClient } from '@vapi-ai/server-sdk'
import jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

// Environment variable detection
const getVapiOrgId = () => {
  return process.env.VAPI_ORG_ID || 
         process.env.NEXT_PUBLIC_VAPI_ORG_ID ||
         '';
};

const getVapiPrivateKey = () => {
  return process.env.VAPI_PRIVATE_KEY ||
         process.env.NEXT_PUBLIC_VAPI_PRIVATE_KEY ||
         '';
};

// Check if VAPI is configured for production
export const isVapiConfigured = () => {
  const orgId = getVapiOrgId();
  const privateKey = getVapiPrivateKey();
  
  return !!(orgId && privateKey && orgId.length > 5 && privateKey.length > 10);
};

// Initialize VAPI server - simplified like webinar-ai-main
let vapiServer: VapiClient;

try {
  if (isVapiConfigured()) {
    console.log("🚀 VAPI Server: Initializing production mode");

    // Define the payload for JWT
    const payload = {
      orgId: getVapiOrgId(),
      token: {
        tag: 'private',
      },
    };

    // Get the private key from environment
    const key = getVapiPrivateKey();

    // Define token options (same as webinar-ai-main)
    const options = {
      expiresIn: 2800, // ~47 minutes
      algorithm: 'HS256' as Algorithm
    };

    // Generate the JWT token
    const token = jwt.sign(payload, key, options);
    console.log("✅ VAPI JWT Token generated successfully");

    // Initialize VAPI client
    vapiServer = new VapiClient({ token });
    console.log("✅ VAPI client initialized successfully");
  } else {
    console.log("🎭 VAPI Server: No valid configuration found, using mock mode");
    
    // Simple mock server for development
    vapiServer = {
      assistants: {
        create: async (assistantConfig: any) => {
          console.log('🎭 Mock VAPI Server: Creating assistant:', assistantConfig.name);
          return { 
            id: `mock_assistant_${Date.now()}`, 
            ...assistantConfig,
            createdAt: new Date().toISOString()
          };
        },
        update: async (id: string, assistantConfig: any) => {
          console.log('🎭 Mock VAPI Server: Updating assistant:', id);
          return { 
            id, 
            ...assistantConfig,
            updatedAt: new Date().toISOString()
          };
        },
        get: async (id: string) => {
          console.log('🎭 Mock VAPI Server: Getting assistant:', id);
          return { 
            id, 
            name: 'Mock Assistant',
            model: { model: 'gpt-4o', provider: 'openai' },
            createdAt: new Date().toISOString()
          };
        },
        list: async () => {
          console.log('🎭 Mock VAPI Server: Listing assistants');
          return { data: [] };
        }
      }
    } as any;
  }
} catch (error) {
  console.error("🔴 Failed to initialize VAPI server:", error);
  throw new Error("Failed to initialize VAPI server");
}

// Export the server instance
export { vapiServer };

// Export configuration status
export const getVapiServerConfig = () => {
  return {
    isConfigured: isVapiConfigured(),
    mode: isVapiConfigured() ? 'production' : 'demo',
    hasOrgId: !!getVapiOrgId(),
    hasPrivateKey: !!getVapiPrivateKey(),
    timestamp: new Date().toISOString()
  };
};

// Export helper functions
export { getVapiOrgId, getVapiPrivateKey }; 