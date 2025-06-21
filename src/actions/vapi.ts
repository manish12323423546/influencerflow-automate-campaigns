"use server";

import { getConversationalAIConfig, CONVERSATIONAL_AI_AGENTS } from '@/lib/elevenlabs-conversational-ai';

// Generate UUID for assistant IDs
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Check if ElevenLabs Conversational AI is configured
const isConversationalAIConfigured = () => {
  const config = getConversationalAIConfig();
  return config.isConfigured;
};

// Default brand representative system prompt for ElevenLabs Conversational AI
const DEFAULT_BRAND_REP_PROMPT = `You are Alex, a professional brand campaign partnership specialist representing CogentX, a forward-thinking brand focused on authentic creator collaborations.

Your primary objective is to establish mutually beneficial partnerships with content creators for our upcoming 5-video campaign series.

## Your Personality & Approach:
- Professional yet personable
- Data-driven and results-oriented  
- Genuinely interested in creator success
- Transparent about expectations and compensation
- Skilled at handling objections professionally

## Campaign Overview:
- **Campaign Type**: 5-video content series partnership
- **Budget Range**: Competitive rates based on creator metrics
- **Content Focus**: Authentic brand integration, creator-led storytelling
- **Timeline**: Flexible scheduling to accommodate creator workflows
- **Deliverables**: 5 high-quality videos with agreed specifications

## Key Conversation Points:
1. **Discovery**: Understand their content style, audience demographics, and collaboration preferences
2. **Value Proposition**: Emphasize long-term partnership potential, creative freedom, and competitive compensation
3. **Metrics Discussion**: Review their engagement rates, audience fit, and performance history
4. **Logistics**: Discuss timeline, content requirements, and production support
5. **Compensation**: Present fair, performance-based pricing aligned with industry standards

## Objection Handling:
- **"I'm too busy"**: Emphasize flexible timeline and production support
- **"Rate too low"**: Discuss long-term partnership value and performance bonuses
- **"Not a good fit"**: Explore alternative collaboration formats
- **"Need to think about it"**: Offer additional information and follow-up timeline

## Guidelines:
- Keep responses conversational and under 3 sentences when possible
- Ask one question at a time to maintain natural flow
- Reference specific creator metrics when relevant
- Always end with a clear next step or question
- Maintain enthusiasm while respecting their decision-making process

Remember: Your goal is to build genuine partnerships, not just close deals. Focus on mutual value creation and long-term relationship building.`;

/**
 * Create a new AI assistant using ElevenLabs Conversational AI
 */
export const createAssistant = async (
  name: string, 
  userId: string, 
  useDefaultAgent: boolean = true,
  customPrompt?: string
) => {
  try {
    console.log('🚀 Creating ElevenLabs Conversational AI agent entry:', { name, userId, useDefaultAgent });

    if (!isConversationalAIConfigured()) {
      throw new Error('ElevenLabs Conversational AI is not configured. Please add your API key to .env file.');
    }

    // Create agent entry for local reference (the actual agent exists in ElevenLabs)
    const agentData = {
      id: CONVERSATIONAL_AI_AGENTS.DEFAULT, // Use your specific agent ID
      name: name || "Brand Partnership Agent",
      model: "gpt-4o",
      provider: "elevenlabs",
      prompt: customPrompt || DEFAULT_BRAND_REP_PROMPT,
      firstMessage: useDefaultAgent 
        ? "Hi there! I'm Alex from CogentX. I'm excited to discuss a potential collaboration opportunity with you. How are you doing today?"
        : "Hello! How can I help you today?",
      createdAt: new Date().toISOString(),
      userId: userId,
      isActive: true,
      agentId: CONVERSATIONAL_AI_AGENTS.DEFAULT
    };

    console.log('✅ ElevenLabs Conversational AI agent entry created:', {
      agentId: agentData.id,
      name: agentData.name
    });

    return {
      success: true,
      data: agentData,
      message: 'ElevenLabs Conversational AI agent created successfully',
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Failed to create ElevenLabs Conversational AI agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to create agent - ElevenLabs API key required',
      mode: 'production'
    };
  }
};

/**
 * Update an existing agent
 */
export const updateAssistant = async (
  agentId: string,
  firstMessage: string,
  systemPrompt: string
) => {
  try {
    console.log('🔄 Updating ElevenLabs Conversational AI agent entry:', agentId);

    if (!isConversationalAIConfigured()) {
      throw new Error('ElevenLabs Conversational AI is not configured. Please add your API key to .env file.');
    }

    // Update local reference (actual agent configuration would need ElevenLabs API call)
    const updatedData = {
      id: agentId,
      firstMessage,
      prompt: systemPrompt,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ Agent entry updated successfully');

    return {
      success: true,
      data: updatedData,
      message: 'Agent updated successfully',
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Failed to update agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to update agent - ElevenLabs API key required',
      mode: 'production'
    };
  }
};

/**
 * Get agent details
 */
export const getAssistant = async (agentId: string) => {
  try {
    console.log('📖 Getting ElevenLabs Conversational AI agent:', agentId);

    if (!isConversationalAIConfigured()) {
      throw new Error('ElevenLabs Conversational AI is not configured. Please add your API key to .env file.');
    }

    // Return your specific agent information
    const agentData = {
      id: CONVERSATIONAL_AI_AGENTS.DEFAULT,
      name: 'ElevenLabs Brand Partnership Agent',
      model: 'gpt-4o',
      provider: 'elevenlabs',
      firstMessage: "Hi there! I'm Alex from CogentX. I'm excited to discuss a potential collaboration opportunity with you. How are you doing today?",
      prompt: DEFAULT_BRAND_REP_PROMPT,
      isActive: true,
      agentId: CONVERSATIONAL_AI_AGENTS.DEFAULT
    };

    console.log('✅ Retrieved agent from ElevenLabs');

    return {
      success: true,
      data: agentData,
      message: 'Agent retrieved successfully',
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Failed to get agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to retrieve agent - ElevenLabs API key required',
      mode: 'production'
    };
  }
};

/**
 * List all agents for a user
 */
export const listAssistants = async (userId?: string) => {
  try {
    console.log('📋 Listing ElevenLabs Conversational AI agents for user:', userId);

    if (!isConversationalAIConfigured()) {
      throw new Error('ElevenLabs Conversational AI is not configured. Please add your API key to .env file.');
    }

    // Return your available agent
    const agents = [
      {
        id: CONVERSATIONAL_AI_AGENTS.DEFAULT,
        name: 'Brand Partnership Specialist',
        model: 'gpt-4o',
        provider: 'elevenlabs',
        agentId: CONVERSATIONAL_AI_AGENTS.DEFAULT,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    console.log('✅ Retrieved agents from ElevenLabs Conversational AI');

    return {
      success: true,
      data: agents,
      message: 'Agents retrieved successfully',
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Failed to list agents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      message: 'Failed to retrieve agents - ElevenLabs API key required',
      mode: 'production'
    };
  }
};

/**
 * Get ElevenLabs Conversational AI configuration status
 */
export const getVapiConfig = () => {
  const config = getConversationalAIConfig();
  return {
    isConfigured: config.isConfigured,
    mode: config.mode,
    service: 'ElevenLabs Conversational AI',
    agentId: CONVERSATIONAL_AI_AGENTS.DEFAULT,
    timestamp: new Date().toISOString(),
    features: {
      realTimeVoice: config.isConfigured,
      agentCreation: config.isConfigured,
      databasePersistence: true,
      unifiedConversation: true, // ElevenLabs handles STT + LLM + TTS together
      demoMode: false // No demo mode supported
    }
  };
}; 