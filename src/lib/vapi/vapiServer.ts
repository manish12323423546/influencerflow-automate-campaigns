import jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'
import { getEnvironmentConfig } from '@/lib/config/environment'

// Get environment configuration
const envConfig = getEnvironmentConfig();

// Initialize VAPI server based on configuration
let vapiServer: any;
let isVapiConfigured: boolean;
let vapiConfigStatus: any;

if (!envConfig.vapi.isConfigured) {
  console.log("🎭 VAPI Server: Using mock mode due to missing configuration");
  
  // Mock server for development
  vapiServer = {
    assistants: {
      create: async (assistantConfig: any) => {
        console.log('🎭 Mock VAPI Server: Creating assistant:', assistantConfig.name);
        return { 
          id: `mock_${Date.now()}`, 
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
          model: { model: 'gpt-4o', provider: 'openai' }
        };
      },
      list: async () => {
        console.log('🎭 Mock VAPI Server: Listing assistants');
        return { data: [] };
      }
    }
  };
  
  isVapiConfigured = false;
  vapiConfigStatus = { valid: false, mode: 'demo' };
} else {
  // Real VAPI server implementation
  console.log("🚀 VAPI Server: Initializing production mode");

  // Import VAPI SDK only when configuration is valid
  let VapiClient: any;
  try {
    const vapiSdk = require('@vapi-ai/server-sdk');
    VapiClient = vapiSdk.VapiClient;
  } catch (error) {
    console.error("❌ Failed to import VAPI SDK:", error);
    throw new Error("VAPI SDK not available");
  }

  // Define the payload for JWT
  const payload = {
    orgId: envConfig.vapi.orgId,
    token: {
      tag: 'private',
    },
  };

  // Get the private key from environment configuration
  const key = envConfig.vapi.privateKey!;

  // Define token options
  const options = {
    expiresIn: 2800, // ~47 minutes
    algorithm: 'HS256' as Algorithm
  };

  let token: string;
  try {
    // Generate the JWT token
    token = jwt.sign(payload, key, options);
    console.log("✅ VAPI JWT Token generated successfully", {
      tokenLength: token?.length || 0,
      expiresIn: options.expiresIn,
      orgId: envConfig.vapi.orgId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("🔴 Failed to generate VAPI JWT token:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw new Error("Failed to initialize VAPI client");
  }

  try {
    console.log("🔄 Initializing VAPI client...");
    vapiServer = new VapiClient({ token });
    console.log("✅ VAPI client initialized successfully");
  } catch (error) {
    console.error("🔴 Failed to initialize VAPI client:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    throw new Error("Failed to initialize VAPI client");
  }

  isVapiConfigured = true;
  vapiConfigStatus = { valid: true, mode: 'production' };
}

// Export all variables
export { vapiServer, isVapiConfigured, vapiConfigStatus };

// Export additional configuration details
export const getVapiServerConfig = () => {
  return {
    isConfigured: isVapiConfigured,
    mode: envConfig.vapi.mode,
    hasOrgId: !!envConfig.vapi.orgId,
    hasPrivateKey: !!envConfig.vapi.privateKey,
    hasPublicKey: !!envConfig.vapi.publicKey,
    environmentConfig: envConfig,
    timestamp: new Date().toISOString()
  };
}; 