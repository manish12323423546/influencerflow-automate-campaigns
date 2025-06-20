"use server";

import { vapiServer, isVapiConfigured } from '@/lib/vapi/vapiServer';

// UUID generator that works in both client and server environments
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// AI Agent Prompts - Enhanced from webinar-ai-main
const aiAgentPrompts = {
  brand_representative: `You are a professional brand representative AI assistant specializing in influencer marketing. Your expertise includes:

- Brand partnerships and collaborations  
- Campaign planning and strategy
- Influencer relationship management
- Contract negotiations and terms
- Performance analytics and ROI optimization
- Content strategy and brand alignment
- Market trend analysis

You should be:
- Friendly, professional, and approachable
- Knowledgeable about current marketing trends
- Skilled at identifying mutual value propositions
- Expert at explaining campaign benefits clearly
- Focused on building long-term relationships

Always maintain a professional yet personable tone, and focus on creating win-win scenarios for both brands and influencers.`,

  sales_agent: `You are an expert sales AI agent specializing in influencer marketing solutions. Your role includes:

- Qualifying leads and understanding client needs
- Presenting campaign benefits and value propositions
- Handling objections professionally and effectively
- Closing deals and scheduling follow-ups
- Providing excellent customer service
- Understanding budget constraints and ROI expectations

Be persuasive, empathetic, and results-oriented while maintaining authenticity and trust.`,

  customer_support: `You are a helpful customer support AI agent for influencer marketing campaigns. You assist with:

- Answering product and campaign questions
- Troubleshooting technical issues
- Processing requests and handling complaints
- Providing guidance and tutorials
- Escalating complex issues when needed
- Managing expectations and timelines

Be patient, helpful, solution-focused, and always aim to exceed customer expectations.`
};

export const createAssistant = async (name: string, userId: string, useDefaultAgent: boolean = true) => {
  console.log("🎯 Starting createAssistant server action:", {
    name,
    userId,
    useDefaultAgent,
    isVapiConfigured,
    timestamp: new Date().toISOString()
  });

  try {
    // Generate our own UUID since VAPI might not return one consistently
    const assistantId = generateUUID();
    console.log("🆔 Generated assistant ID:", assistantId);
    
    const firstMessage = useDefaultAgent 
      ? `Hey! This is ${name} from our brand partnerships team. I've been checking out your content and I'm really excited to chat with you about an amazing campaign opportunity we have. Are you ready to hear about something that could be a perfect fit for your audience?`
      : `Hello! I'm ${name}, your AI assistant. How can I help you today?`;

    const systemPrompt = useDefaultAgent ? aiAgentPrompts.brand_representative : "";

    console.log("🤖 Preparing assistant configuration:", {
      assistantId,
      firstMessage: firstMessage.substring(0, 50) + "...",
      hasSystemPrompt: !!systemPrompt,
      isVapiConfigured,
      timestamp: new Date().toISOString()
    });

    // Assistant configuration for VAPI
    const assistantConfig = {
      name: name,
      firstMessage: firstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.7,
      },
      serverMessages: [],
      // Add additional configuration for better performance
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM" // Default voice, can be customized
      },
      // Transcriber configuration
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US"
      }
    };

    if (isVapiConfigured) {
      console.log("🌐 Creating assistant in real VAPI...");
      try {
        const vapiResponse = await vapiServer.assistants.create(assistantConfig);
        console.log("✅ Real VAPI assistant created successfully:", vapiResponse.id);
        
        // Use VAPI's returned ID if available, otherwise use our generated one
        const finalAssistantId = vapiResponse.id || assistantId;
        
        // Store assistant data for local reference
        const aiAgent = {
          id: finalAssistantId,
          name: name,
          model: "gpt-4o",
          provider: "openai", 
          prompt: systemPrompt,
          firstMessage: firstMessage,
          createdAt: new Date().toISOString(),
          isActive: true,
          vapiId: vapiResponse.id, // Store VAPI's ID separately
          mode: 'production'
        };

        console.log("✅ Real VAPI assistant created and stored:", {
          assistantId: finalAssistantId,
          vapiId: vapiResponse.id,
          name: aiAgent.name,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          status: 200,
          data: aiAgent,
          mode: 'production'
        };
      } catch (vapiError) {
        console.error("🔴 Real VAPI creation failed, falling back to mock:", vapiError);
        // Fall through to mock creation
      }
    }

    // Mock/Demo mode or fallback
    console.log("🎭 Creating assistant in demo mode...");
    await vapiServer.assistants.create(assistantConfig);
    console.log("✅ Demo VAPI assistant created successfully");

    // Store in demo mode
    const aiAgent = {
      id: assistantId,
      name: name,
      model: "gpt-4o",
      provider: "openai", 
      prompt: systemPrompt,
      firstMessage: firstMessage,
      createdAt: new Date().toISOString(),
      isActive: true,
      mode: 'demo'
    };

    console.log("✅ Demo assistant stored successfully:", {
      assistantId: aiAgent.id,
      name: aiAgent.name,
      mode: 'demo',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      status: 200,
      data: aiAgent,
      mode: 'demo'
    };
  } catch (error) {
    console.error("🔴 Error in createAssistant:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      isVapiConfigured,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      status: 500,
      message: "Failed to create agent",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Update assistant with enhanced functionality
export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  console.log("🔄 Starting updateAssistant:", {
    assistantId,
    hasFirstMessage: !!firstMessage,
    hasSystemPrompt: !!systemPrompt,
    isVapiConfigured,
    timestamp: new Date().toISOString()
  });

  try {
    const updateConfig = {
      firstMessage: firstMessage,
      model: {
        model: "gpt-4o",
        provider: "openai",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.7,
      },
      serverMessages: [],
    };

    if (isVapiConfigured) {
      console.log("🌐 Updating assistant in real VAPI...");
      try {
        const vapiResponse = await vapiServer.assistants.update(assistantId, updateConfig);
        console.log("✅ Real VAPI assistant updated successfully");

        return {
          success: true,
          status: 200,
          data: {
            id: assistantId,
            firstMessage: firstMessage,
            prompt: systemPrompt,
            updatedAt: new Date().toISOString(),
            mode: 'production'
          },
        };
      } catch (vapiError) {
        console.error("🔴 Real VAPI update failed, falling back to mock:", vapiError);
        // Fall through to mock update
      }
    }

    // Mock/Demo mode or fallback
    console.log("🎭 Updating assistant in demo mode...");
    await vapiServer.assistants.update(assistantId, updateConfig);
    console.log("✅ Demo VAPI assistant updated successfully");

    return {
      success: true,
      status: 200,
      data: {
        id: assistantId,
        firstMessage: firstMessage,
        prompt: systemPrompt,
        updatedAt: new Date().toISOString(),
        mode: 'demo'
      },
    };
  } catch (error) {
    console.error("🔴 Error updating assistant:", {
      error: error instanceof Error ? error.message : "Unknown error",
      assistantId,
      isVapiConfigured,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      status: 500,
      error: error,
      message: "Failed to update agent",
    };
  }
};

// Get assistant details
export const getAssistant = async (assistantId: string) => {
  console.log("📋 Getting assistant details:", {
    assistantId,
    isVapiConfigured,
    timestamp: new Date().toISOString()
  });

  try {
    if (isVapiConfigured) {
      console.log("🌐 Getting assistant from real VAPI...");
      try {
        const vapiResponse = await vapiServer.assistants.get(assistantId);
        console.log("✅ Real VAPI assistant retrieved successfully");
        return {
          success: true,
          status: 200,
          data: vapiResponse,
          mode: 'production'
        };
      } catch (vapiError) {
        console.error("🔴 Real VAPI get failed, falling back to mock:", vapiError);
      }
    }

    // Mock/Demo mode or fallback
    console.log("🎭 Getting assistant in demo mode...");
    const mockAssistant = await vapiServer.assistants.get(assistantId);
    console.log("✅ Demo assistant retrieved successfully");

    return {
      success: true,
      status: 200,
      data: mockAssistant,
      mode: 'demo'
    };
  } catch (error) {
    console.error("🔴 Error getting assistant:", {
      error: error instanceof Error ? error.message : "Unknown error",
      assistantId,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      status: 500,
      message: "Failed to get agent",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// List all assistants
export const listAssistants = async () => {
  console.log("📋 Listing all assistants:", {
    isVapiConfigured,
    timestamp: new Date().toISOString()
  });

  try {
    if (isVapiConfigured) {
      console.log("🌐 Getting assistants from real VAPI...");
      try {
        const vapiResponse = await vapiServer.assistants.list();
        console.log("✅ Real VAPI assistants retrieved successfully");
        return {
          success: true,
          status: 200,
          data: vapiResponse.data || vapiResponse,
          mode: 'production'
        };
      } catch (vapiError) {
        console.error("🔴 Real VAPI list failed, falling back to mock:", vapiError);
      }
    }

    // Mock/Demo mode or fallback
    console.log("🎭 Getting assistants in demo mode...");
    const mockAssistants = await vapiServer.assistants.list();
    console.log("✅ Demo assistants retrieved successfully");

    return {
      success: true,
      status: 200,
      data: mockAssistants.data || [],
      mode: 'demo'
    };
  } catch (error) {
    console.error("🔴 Error listing assistants:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      status: 500,
      message: "Failed to list agents",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Export configuration status
export const getVapiConfig = () => {
  return {
    isConfigured: isVapiConfigured,
    mode: isVapiConfigured ? 'production' : 'demo',
    timestamp: new Date().toISOString()
  };
}; 