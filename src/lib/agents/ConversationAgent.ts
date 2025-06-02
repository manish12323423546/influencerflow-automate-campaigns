import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder,
  SystemMessagePromptTemplate 
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Campaign } from '@/types/campaign';
import type { Influencer } from '@/types/influencer';

export interface ConversationAgentConfig {
  openAIApiKey: string;
  tools: Tool[];
  systemPrompt?: string;
  modelName?: string;
  temperature?: number;
}

export class ConversationAgent {
  private chain: RunnableSequence | null = null;
  private config: ConversationAgentConfig;
  private supabaseClient: typeof supabase;

  constructor(config: ConversationAgentConfig) {
    console.log('🤖 Initializing ConversationAgent with config:', {
      modelName: config.modelName,
      temperature: config.temperature,
      hasTools: config.tools.length > 0,
      systemPrompt: config.systemPrompt?.substring(0, 50) + '...'
    });
    this.config = config;
    this.supabaseClient = supabase;
  }

  async initialize() {
    console.log('🚀 Starting agent initialization...');
    try {
      const model = new ChatOpenAI({
        openAIApiKey: this.config.openAIApiKey,
        modelName: this.config.modelName || "gpt-4o-mini",
        temperature: this.config.temperature || 0.7,
      });
      console.log('✅ Created ChatOpenAI model instance:', {
        model: this.config.modelName || "gpt-4o-mini",
        temperature: this.config.temperature || 0.7
      });

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          this.config.systemPrompt || 
          "You are an AI assistant helping manage influencer marketing campaigns. Use the available tools to help users manage campaigns, find influencers, and handle communications."
        ),
        ["human", "{input}"],
      ]);
      console.log('📝 Created chat prompt template');

      this.chain = RunnableSequence.from([
        {
          input: (input: string) => input,
          tools: () => this.config.tools,
        },
        prompt,
        model,
      ]);
      console.log('⛓️ Created runnable sequence chain');
      console.log('✨ Agent initialization complete');
    } catch (error) {
      console.error('❌ Error during agent initialization:', error);
      throw error;
    }
  }

  async chat(input: string) {
    console.log('📨 Received chat input:', input);
    
    if (!this.chain) {
      console.error('❌ Chain not initialized');
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    try {
      console.log('🔄 Processing message through chain...');
      const result = await this.chain.invoke({ input });
      console.log('✅ Chain processing complete:', {
        outputLength: result.content.length,
        firstFewWords: result.content.substring(0, 50) + '...'
      });
      
      return {
        output: result.content,
        intermediateSteps: []
      };
    } catch (error) {
      console.error("❌ Error in agent chat:", error);
      throw error;
    }
  }

  async sendMessage(input: string) {
    console.log('📤 Sending message:', input);
    const response = await this.chat(input);
    console.log('📥 Received response:', {
      outputLength: response.output.length,
      firstFewWords: response.output.substring(0, 50) + '...'
    });
    return response;
  }

  // Helper methods using our Supabase client
  async getCampaignDetails(campaignId: string): Promise<Campaign | null> {
    console.log('🔍 Fetching campaign details for ID:', campaignId);
    const { data, error } = await this.supabaseClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching campaign:', error);
      throw error;
    }
    console.log('✅ Campaign details retrieved:', data);
    return data;
  }

  async getInfluencerDetails(influencerId: string): Promise<Influencer | null> {
    console.log('🔍 Fetching influencer details for ID:', influencerId);
    const { data, error } = await this.supabaseClient
      .from('influencers')
      .select('*')
      .eq('id', influencerId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching influencer:', error);
      throw error;
    }
    console.log('✅ Influencer details retrieved:', data);
    return data as Influencer;
  }

  async searchInfluencers(query: string): Promise<Influencer[]> {
    console.log('🔍 Searching influencers with query:', query);
    const { data, error } = await this.supabaseClient
      .from('influencers')
      .select('*')
      .textSearch('name', query);
    
    if (error) {
      console.error('❌ Error searching influencers:', error);
      throw error;
    }
    console.log('✅ Found influencers:', data?.length || 0);
    return (data || []) as Influencer[];
  }

  async updateCampaignStatus(campaignId: string, status: string) {
    console.log('📝 Updating campaign status:', { campaignId, status });
    const { error } = await this.supabaseClient
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId);
    
    if (error) {
      console.error('❌ Error updating campaign status:', error);
      throw error;
    }
    console.log('✅ Campaign status updated successfully');
  }
} 