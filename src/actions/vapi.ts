"use server";

import { vapiServer } from "@/lib/vapi/vapiServer";
import { randomUUID } from 'crypto';

const DEFAULT_AI_PROMPT = `You are a professional brand representative AI assistant. You help with:
- Brand partnerships and collaborations
- Campaign planning and strategy
- Influencer relationship management
- Contract negotiations
- Performance analytics
Be friendly, professional, and knowledgeable about marketing trends.`;

export const createAssistant = async (name: string, userId: string, useDefaultAgent: boolean = true) => {
  console.log("🎯 Starting createAssistant server action:", {
    name,
    userId,
    useDefaultAgent,
    timestamp: new Date().toISOString()
  });

  try {
    // Generate our own ID since VAPI might not return one
    const assistantId = randomUUID();
    console.log("🆔 Generated assistant ID:", assistantId);
    
    const firstMessage = useDefaultAgent 
      ? `Hey! This is ${name} from our brand partnerships team. I've been checking out your content and I'm really excited to chat with you about an amazing collaboration opportunity we have. Are you ready to hear about something that could be a perfect fit for your audience?`
      : `Hello! I'm ${name}, your AI assistant. How can I help you today?`;

    const systemPrompt = useDefaultAgent ? DEFAULT_AI_PROMPT : "";

    console.log("🤖 Preparing assistant configuration:", {
      assistantId,
      firstMessage: firstMessage.substring(0, 50) + "...",
      hasSystemPrompt: !!systemPrompt,
      timestamp: new Date().toISOString()
    });

    console.log("🌐 Creating assistant in VAPI...");
    await vapiServer.assistants.create({
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

    // Create the agent object to return - use the same ID for both local and VAPI
    const aiAgent = {
      id: assistantId, // Use same ID for VAPI calls
      model: "gpt-4o",
      provider: "openai",
      prompt: systemPrompt,
      name: name,
      firstMessage: firstMessage,
      userId: userId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    console.log("✅ Assistant record prepared successfully:", {
      assistantId: aiAgent.id,
      vapiId: aiAgent.vapiId,
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
  try {
    console.log("🔄 Updating assistant:", assistantId);
    
    const updateAssistant = await vapiServer.assistants.update(assistantId, {
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
      },
      serverMessages: [],
    });
    console.log("Assistant updated:", updateAssistant);

    // Update in localStorage
    const existingAgents = JSON.parse(localStorage.getItem('meeting_ai_agents') || '[]');
    const updatedAgents = existingAgents.map((agent: any) => 
      agent.id === assistantId 
        ? { ...agent, firstMessage, prompt: systemPrompt }
        : agent
    );
    localStorage.setItem('meeting_ai_agents', JSON.stringify(updatedAgents));

    return {
      success: true,
      status: 200,
      data: updateAssistant,
    };
  } catch (error) {
    console.error("Error updating agent:", error);
    return {
      success: false,
      status: 500,
      error: error,
      message: "Failed to update agent",
    };
  }
}; 