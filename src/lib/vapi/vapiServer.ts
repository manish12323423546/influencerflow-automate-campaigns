import { VapiClient } from '@vapi-ai/server-sdk'
import jwt from 'jsonwebtoken'
import { Algorithm } from 'jsonwebtoken'

// Define the payload
const payload = {
  orgId: process.env.VAPI_ORG_ID || "demo_org_id",
  token: {
    // This is the scope of the token
    tag: 'private',
  },
}

// Get the private key from environment variables
const key = process.env.VAPI_PRIVATE_KEY || "demo_private_key"

if (!key || !process.env.VAPI_ORG_ID) {
  console.warn("⚠️ VAPI Configuration Warning:", {
    hasPrivateKey: !!key,
    hasOrgId: !!process.env.VAPI_ORG_ID,
    mode: "demo",
    timestamp: new Date().toISOString()
  });
  console.log("Using demo mode - real VAPI integration will be used when proper keys are provided");
  
  // In demo mode, don't try to create real assistants
  if (typeof window === 'undefined') { // Server-side
    throw new Error("VAPI credentials not configured - cannot create real assistants");
  }
}

// Define token options
const options = {
  expiresIn: 2800, // 1 hour in seconds
  algorithm: 'HS256' as Algorithm
}

let token: string;
let vapiServer: any;

try {
  // Generate the token using a JWT library or built-in functionality
  token = jwt.sign(payload, key, options);
  console.log("✅ VAPI JWT Token generated successfully", {
    tokenLength: token?.length || 0,
    timestamp: new Date().toISOString()
  });
  
  console.log("🔄 Initializing VAPI client...");
  vapiServer = new VapiClient({ token });
  console.log("✅ VAPI client initialized successfully");
} catch (error) {
  console.warn("⚠️ VAPI initialization in demo mode:", {
    error: error instanceof Error ? error.message : "Unknown error",
    timestamp: new Date().toISOString()
  });
  
  // Create a mock server for demo purposes
  vapiServer = {
    assistants: {
      create: async (assistant: any) => {
        console.log("🎭 Demo mode: Creating assistant", assistant);
        return { id: `demo_assistant_${Date.now()}`, ...assistant };
      },
      update: async (id: string, data: any) => {
        console.log("🎭 Demo mode: Updating assistant", id, data);
        return { id, ...data };
      },
      list: async () => {
        console.log("🎭 Demo mode: Listing assistants");
        return [];
      }
    }
  };
}

export { vapiServer }; 