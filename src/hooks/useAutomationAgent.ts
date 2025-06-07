import { useState, useCallback, useEffect } from 'react';
import { ChatOpenAI } from "@langchain/openai";
import { CampaignAutomationAgent } from '@/lib/agents/CampaignAutomationAgent';
import { CampaignState, CampaignStatus, CreatorContactPreference, Creator } from '@/lib/agents/types';
import { AutomationLoggingService } from '@/lib/services/automationLoggingService';
import { getCampaignTools } from '@/lib/agents/tools';
import { PromptTemplate } from "@langchain/core/prompts";
import { supabase } from '@/integrations/supabase/client';

interface UseAutomationAgentProps {
  campaignId: string;   
  mode: 'AUTOMATIC' | 'MANUAL';
}

export const useAutomationAgent = ({ campaignId, mode }: UseAutomationAgentProps) => {
  const [state, setState] = useState<CampaignState>({
    status: CampaignStatus.INITIATED,
    selectedCreators: [],
    sentContracts: [],
    communications: [],
    creatorPreferences: []
  });

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<CampaignAutomationAgent | null>(null);

  // Load selected influencers when component mounts
  useEffect(() => {
    const loadSelectedInfluencers = async () => {
      try {
        // Get campaign-influencer relationships
        const { data: relationships, error: relError } = await supabase
          .from('campaign_influencers')
          .select('influencer_id, match_score, match_reason')
          .eq('campaign_id', campaignId);

        if (relError) throw relError;

        if (relationships && relationships.length > 0) {
          // Get influencer details
          const { data: influencers, error: infError } = await supabase
            .from('influencers')
            .select('*')
            .in('id', relationships.map(r => r.influencer_id));

          if (infError) throw infError;

          if (influencers) {
            // Transform influencers to creators format
            const creators: Creator[] = influencers.map(inf => {
              const relationship = relationships.find(r => r.influencer_id === inf.id);
              return {
                id: inf.id,
                name: inf.name,
                email: inf.gmail_gmail,
                phone: inf.phone_no?.toString(),
                metrics: {
                  followers: inf.followers_count,
                  engagement: inf.engagement_rate,
                  relevanceScore: inf.audience_fit_score
                },
                contactPreference: 'NONE' as const
              };
            });

            // Update state with creators
            setState(prev => ({
              ...prev,
              selectedCreators: creators
            }));
          }
        }
      } catch (error) {
        console.error('Error loading selected influencers:', error);
        setError('Failed to load selected influencers');
      }
    };

    loadSelectedInfluencers();
  }, [campaignId]);

  const updateCreatorPreferences = useCallback((preferences: CreatorContactPreference[]) => {
    if (agent) {
      agent.setCreatorPreferences(preferences);
    }
    setState(prev => ({
      ...prev,
      creatorPreferences: preferences,
      selectedCreators: prev.selectedCreators.map(creator => ({
        ...creator,
        contactPreference: preferences.find(p => p.creatorId === creator.id)?.contactMethod || 'NONE'
      }))
    }));
  }, [agent]);

  const startAutomation = useCallback(async () => {
    console.log('🚀 Starting automation for campaign:', campaignId);
    setIsRunning(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Please check your environment variables.');
      }

      console.log('🔑 Initializing ChatOpenAI with API key');
      
      let model;
      try {
        if (!apiKey.startsWith('sk-') || apiKey.includes('=')) {
          throw new Error('Invalid OpenAI API key format. Please check your API key.');
        }

        model = new ChatOpenAI({
          modelName: "gpt-4.1-nano",
          temperature: 0.7,
          openAIApiKey: apiKey,
        });
      } catch (modelError) {
        console.error('Error initializing ChatOpenAI:', modelError);
        throw new Error('Failed to initialize AI model: ' + modelError.message);
      }

      console.log('🤖 Creating CampaignAutomationAgent...');
      const newAgent = new CampaignAutomationAgent(
        model,
        {
          campaignId,
          userId: 'e5c58861-fada-4c8c-bbe7-f7aff2879fcb', // TODO: Get from auth context
          mode
        },
        (newState) => {
          console.log('📊 Agent state updated:', newState.status);
          setState(newState);
        }
      );

      setAgent(newAgent);

      console.log('🔧 Initializing agent...');
      await newAgent.initialize();

      // Apply any existing preferences before execution
      if (state.creatorPreferences?.length) {
        console.log('⚙️ Applying creator preferences:', state.creatorPreferences.length, 'preferences');
        newAgent.setCreatorPreferences(state.creatorPreferences);
      }

      console.log('▶️ Starting campaign execution...');
      await newAgent.executeCampaign();
      console.log('✅ Campaign execution completed successfully');

    } catch (err) {
      console.error('Automation error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('template')) {
          errorMessage = 'AI configuration error: ' + err.message;
        } else if (err.message.includes('API key')) {
          errorMessage = 'Authentication error: ' + err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, [campaignId, mode, state.creatorPreferences]);

  const resetAutomation = useCallback(() => {
    setState({
      status: CampaignStatus.INITIATED,
      selectedCreators: [],
      sentContracts: [],
      communications: [],
      creatorPreferences: []
    });
    setError(null);
    setAgent(null);
  }, []);

  const getAutomationReport = useCallback(async (campaignId: string) => {
    try {
      const loggingService = AutomationLoggingService.getInstance();
      return await loggingService.getAutomationReport(campaignId);
    } catch (error) {
      console.error('Failed to get automation report:', error);
      return null;
    }
  }, []);

  const getAutomationLogs = useCallback(async (campaignId: string) => {
    try {
      const loggingService = AutomationLoggingService.getInstance();
      return await loggingService.getAutomationLogs(campaignId);
    } catch (error) {
      console.error('Failed to get automation logs:', error);
      return [];
    }
  }, []);

  const testAutomationLogging = useCallback(async (campaignId: string, userId: string) => {
    try {
      const loggingService = AutomationLoggingService.getInstance();
      await loggingService.testLogging(campaignId, userId);
      console.log('Automation logging test completed successfully');
    } catch (error) {
      console.error('Automation logging test failed:', error);
      throw error;
    }
  }, []);

  return {
    state,
    isRunning,
    error,
    startAutomation,
    resetAutomation,
    updateCreatorPreferences,
    getAutomationReport,
    getAutomationLogs,
    testAutomationLogging,
  };
};
