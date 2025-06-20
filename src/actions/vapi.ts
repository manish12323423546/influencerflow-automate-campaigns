"use server";

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

// AI Agent Prompts
const aiAgentPrompt = `You are a professional brand representative AI assistant. You help with:
- Brand partnerships and collaborations  
- Campaign planning and strategy
- Influencer relationship management
- Contract negotiations
- Performance analytics

Be friendly, professional, and knowledgeable about marketing trends.`;

// Mock VAPI server for demo purposes
const mockVapiServer = {
  assistants: {
    create: async (config: any) => {
      console.log('🎭 Mock VAPI: Creating assistant with config:', config);
      return { id: generateUUID(), ...config };
    },
    update: async (id: string, config: any) => {
      console.log('🎭 Mock VAPI: Updating assistant:', id, config);
      return { id, ...config };
    }
  }
};

export const createAssistant = async (name: string, userId: string, useDefaultAgent: boolean = true) => {
  console.log("🎯 Starting createAssistant server action:", {
    name,
    userId,
    useDefaultAgent,
    timestamp: new Date().toISOString()
  });

  try {
    // Generate our own UUID since VAPI might not return one consistently
    const assistantId = generateUUID();
    console.log("🆔 Generated assistant ID:", assistantId);
    
    const firstMessage = useDefaultAgent 
      ? `Hey! This is ${name} from our brand partnerships team. I've been checking out your content and I'm really excited to chat with you about an amazing campaign opportunity we have. Are you ready to hear about something that could be a perfect fit for your audience?`
      : `Hello! I'm ${name}, your AI assistant. How can I help you today?`;

    const systemPrompt = useDefaultAgent ? aiAgentPrompt : "";

    console.log("🤖 Preparing assistant configuration:", {
      assistantId,
      firstMessage: firstMessage.substring(0, 50) + "...",
      hasSystemPrompt: !!systemPrompt,
      timestamp: new Date().toISOString()
    });

    console.log("🌐 Creating assistant in VAPI...");
    // For now, using mock server - in production, replace with real VAPI server
    await mockVapiServer.assistants.create({
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
    });
    console.log("✅ VAPI assistant created successfully");

    console.log("💾 Storing assistant in local storage...");
    // Store in localStorage since we don't have a database
    const aiAgent = {
      id: assistantId,
      name: name,
      model: "gpt-4o",
      provider: "openai", 
      prompt: systemPrompt,
      firstMessage: firstMessage,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Store in localStorage
    if (typeof window !== 'undefined') {
      const existingAgents = JSON.parse(localStorage.getItem('meeting_ai_agents') || '[]');
      existingAgents.push(aiAgent);
      localStorage.setItem('meeting_ai_agents', JSON.stringify(existingAgents));
    }

    console.log("✅ Assistant stored successfully:", {
      assistantId: aiAgent.id,
      name: aiAgent.name,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      status: 200,
      data: aiAgent,
    };
  } catch (error) {
    console.error("🔴 Error in createAssistant:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      status: 500,
      message: "Failed to create agent",
    };
  }
};

// Update assistant
export const updateAssistant = async (
  assistantId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  console.log("🔄 Starting updateAssistant:", {
    assistantId,
    hasFirstMessage: !!firstMessage,
    hasSystemPrompt: !!systemPrompt,
    timestamp: new Date().toISOString()
  });

  try {
    console.log("🌐 Updating assistant in VAPI...");
    await mockVapiServer.assistants.update(assistantId, {
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
    });
    console.log("✅ VAPI assistant updated successfully");

    // Update in localStorage
    if (typeof window !== 'undefined') {
      const existingAgents = JSON.parse(localStorage.getItem('meeting_ai_agents') || '[]');
      const agentIndex = existingAgents.findIndex((agent: any) => agent.id === assistantId);
      
      if (agentIndex !== -1) {
        existingAgents[agentIndex] = {
          ...existingAgents[agentIndex],
          firstMessage: firstMessage,
          prompt: systemPrompt,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('meeting_ai_agents', JSON.stringify(existingAgents));
        
        console.log("✅ Assistant updated in storage:", {
          assistantId,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          status: 200,
          data: existingAgents[agentIndex],
        };
      } else {
        throw new Error("Assistant not found in storage");
      }
    }

    return {
      success: false,
      status: 404,
      message: "Assistant not found",
    };
  } catch (error) {
    console.error("🔴 Error updating assistant:", {
      error: error instanceof Error ? error.message : "Unknown error",
      assistantId,
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