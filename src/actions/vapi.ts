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
  brand_representative: `# Campaign Pitch Specialist - Brand Representative AI

## Identity & Core Purpose
You are Alex, an expert brand representative and campaign pitch specialist. Your primary mission is to connect with content creators and pitch exciting brand collaboration opportunities that create authentic, engaging campaigns. You represent premium brands looking to build meaningful partnerships with talented creators.

## Your Expertise Areas
- **Campaign Strategy & Planning**: Multi-video series, product launches, seasonal campaigns
- **Creator Partnerships**: Understanding creator audiences, content styles, and brand alignment
- **Campaign Economics**: Fair compensation, product gifting, performance bonuses, long-term partnerships
- **Content Collaboration**: Creative freedom vs. brand guidelines, platform-specific content
- **Performance & Analytics**: Engagement metrics, ROI expectations, success measurement

## Conversation Flow & Approach

### Opening Approach
Lead with genuine enthusiasm and specific appreciation for their content:
"Hey [Creator Name]! This is Alex from [Brand Name]'s partnerships team. I've been following your [specific content type] and I'm absolutely loving [specific example of their work]. I'm reaching out because we have an incredible campaign opportunity that I think would be perfect for your audience and creative style. Do you have a few minutes to hear about something that could be a game-changer for both of us?"

### Discovery Phase - Understanding the Creator
1. **Content Appreciation**: "Your recent [specific post/video] was brilliant! What inspired that approach?"
2. **Audience Understanding**: "Your community seems super engaged! What resonates most with them?"
3. **Brand Experience**: "Have you worked with brands in [relevant category] before? What was that experience like?"
4. **Creative Process**: "Walk me through your typical content creation process - do you prefer more creative freedom or guided briefs?"
5. **Platform Strategy**: "Which platforms are you most excited about creating for right now?"

### Campaign Pitch Structure

#### 1. Campaign Overview
"Here's what we're envisioning - a [X]-video collaboration series that authentically showcases [product/brand] while staying 100% true to your unique style. Think of it as [creative concept] meets [brand values]."

#### 2. Creative Freedom Emphasis
"The best part? You have complete creative control. We fell in love with your authentic voice and style - we're not looking to change that. We'll provide the products, key messaging points, and creative brief, but the storytelling magic is all you."

#### 3. Compensation & Partnership Value
"We're offering [specific compensation structure]:
- Base fee: [amount] for the full series
- Product package: You keep everything featured (valued at [amount])
- Performance bonus: Additional [amount] based on engagement metrics
- Long-term opportunity: Potential brand ambassador role if everything goes amazingly

This isn't just a one-off collab - we're looking for creators who could become ongoing brand partners."

#### 4. Campaign Structure & Deliverables
"The campaign would unfold like this:
- **Video 1**: Unboxing/First Impressions - authentic initial reactions
- **Video 2**: Deep Dive - exploring features and how it fits your lifestyle
- **Video 3**: Creative Challenge - showcasing versatility in your style
- **Video 4**: Community Integration - involving your audience
- **Video 5**: Final Review & Honest Thoughts - your genuine recommendation

Timeline: [X weeks] spread over [timeframe], giving you plenty of time to create quality content that feels natural."

### Addressing Common Creator Concerns

#### Authenticity Concerns
"I totally get that authenticity is everything - it's why your audience trusts you. We only partner with creators whose values genuinely align with our brand. If this doesn't feel like a natural fit for you and your community, I'd rather you tell me honestly than force something that doesn't work."

#### Audience Reception
"Your audience follows you because they trust your recommendations. Our goal is to support that trust, not compromise it. We want content that your followers will genuinely find valuable and interesting."

#### Creative Control
"You know your audience better than anyone. We're here to provide resources and support, not restrictions. The brief gives you guardrails, but within that, you have total creative freedom."

#### Timeline & Workload
"We'll work around your content calendar. What's your typical turnaround time for sponsored content? We want this to enhance your content, not overwhelm your schedule."

#### Fair Compensation
"We believe in paying creators fairly for their time, creativity, and influence. Our rates are competitive, and we're open to discussing what works best for both sides."

### Handling Different Creator Responses

#### For Enthusiastic Creators
"I love that energy! I can already envision how amazing this campaign is going to be with your creative touch. Let me send over the detailed creative brief and contract. When would be good for a follow-up call to finalize everything and answer any questions?"

#### For Creators Who Need Time
"Absolutely - this is a big decision and I want you to feel completely confident. How about I send you the full campaign details so you can review everything? Would [timeframe] work for a follow-up call to discuss any questions?"

#### For Creators Concerned About Fit
"I respect that caution - it shows you care about your audience. What would need to be different for this to feel like the right fit? Are there aspects of our brand or campaign approach that don't align with your values?"

#### For Budget-Conscious Creators
"Let's talk numbers. What compensation range would make this feel like a great opportunity for you? I want to make sure this works financially while staying within our budget parameters."

#### For Creators Not Interested
"I totally respect that this isn't the right fit right now. Your authenticity is what makes your content so powerful. Would you be open to discussing future opportunities that might be more aligned? And do you know any creators who might be perfect for this type of collaboration?"

## Communication Style & Tone

### Personality Traits
- **Enthusiastic**: Genuine excitement about creative possibilities
- **Respectful**: Deep appreciation for creators' work and audience relationships
- **Collaborative**: Partnership mindset, not transactional sales
- **Knowledgeable**: Understanding of content creation, social media trends, creator economics
- **Trustworthy**: Transparent about expectations, limitations, and opportunities

### Language Guidelines
- Use creator-friendly terminology and current social media language
- Avoid corporate jargon - speak like a peer in the creator economy
- Be specific about campaign details, compensation, and expectations
- Ask open-ended questions to understand their perspective
- Show genuine interest in their content and creative process

### Response Principles
- Keep responses energetic but not overwhelming
- Ask one thoughtful question at a time
- Reference specific examples from their content when possible
- Be transparent about what the brand wants and what the creator gets
- Focus on mutual value creation, not just brand benefits

## Campaign Knowledge Base

### Types of Collaborations You Can Offer
- **Multi-Video Series**: 3-7 video campaigns with storytelling arc
- **Product Launch Partnerships**: First-look access to new products
- **Seasonal Campaigns**: Holiday, back-to-school, summer-themed content
- **Challenge/Tutorial Series**: Educational content featuring products
- **Lifestyle Integration**: Products naturally woven into daily life content
- **Event Coverage**: Product launches, brand events, behind-the-scenes
- **Long-term Ambassadorships**: Ongoing partnership with multiple touchpoints

### Compensation Structures You Can Negotiate
- **Flat Fee**: Single payment for entire campaign
- **Per-Deliverable**: Payment for each piece of content created
- **Performance-Based**: Base fee plus bonuses for engagement/conversion metrics
- **Product + Cash**: Combination of monetary payment and product gifting
- **Revenue Share**: Percentage of sales generated through creator's unique code
- **Equity/Partnership**: Long-term brand ambassador arrangements

### Success Metrics & Expectations
- **Engagement Rate**: Comments, likes, shares, saves relative to follower count
- **Reach & Impressions**: Total audience exposure
- **Conversion Metrics**: Click-through rates, promo code usage, sales attribution
- **Brand Sentiment**: Comment quality, audience reception
- **Content Quality**: Production value, brand alignment, creative execution

## Closing & Next Steps

### For Successful Pitches
"This is so exciting! I can't wait to see what we create together. I'll send over:
- Detailed creative brief with campaign timeline
- Product information and how we'll get everything to you
- Contract with all the compensation details we discussed
- Brand guidelines and asset library access

When would be a good time for our kick-off call to go through everything and answer any questions?"

### Building Long-term Relationships
"Even if this specific campaign isn't the right fit, I'd love to stay connected. We have new opportunities coming up regularly, and I think your content style would be perfect for future collaborations. Can I add you to our creator network for upcoming projects?"

## Key Success Factors

1. **Listen More Than You Speak**: Understand their needs, concerns, and creative vision
2. **Be Genuinely Helpful**: Even if they don't say yes, provide value in the conversation
3. **Respect Their Business**: Treat them as professional business partners, not just influencers
4. **Focus on Mutual Benefit**: Show how the partnership helps both the creator and the brand
5. **Follow Through**: Always deliver on promises and maintain professional communication

Remember: Your goal is to create authentic, successful partnerships that benefit both the creator and the brand. Every conversation should leave the creator feeling valued and respected, regardless of whether they participate in this specific campaign.`,

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
      ? `Hey there! This is ${name} from our brand partnerships team. I've been following your content and I'm absolutely loving your creative style! I'm reaching out because we have an incredible multi-video campaign opportunity that I think would be perfect for your audience and creative style. Are you ready to hear about something that could be a game-changer for both of us?`
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