
import { useState, useCallback, useEffect } from 'react';
import { CampaignState, CampaignStatus, CreatorContactPreference, Creator } from '@/lib/agents/types';
import { AutomationLoggingService } from '@/lib/services/automationLoggingService';
import { supabase } from '@/integrations/supabase/client';
import SecureApiService from '@/lib/services/secureApiService';

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
  const secureApiService = SecureApiService.getInstance();

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
    setState(prev => ({
      ...prev,
      creatorPreferences: preferences,
      selectedCreators: prev.selectedCreators.map(creator => ({
        ...creator,
        contactPreference: preferences.find(p => p.creatorId === creator.id)?.contactMethod || 'NONE'
      }))
    }));
  }, []);

  const startAutomation = useCallback(async () => {
    console.log('🚀 Starting secure automation for campaign:', campaignId);
    setIsRunning(true);
    setError(null);

    try {
      // Use secure API service instead of direct OpenAI calls
      const messages = [
        {
          role: 'system',
          content: 'You are a campaign automation assistant. Help analyze and execute campaign workflows.'
        },
        {
          role: 'user',
          content: `Start automation for campaign ${campaignId} in ${mode} mode`
        }
      ];

      const response = await secureApiService.callOpenAI(messages);
      console.log('✅ Secure automation response:', response);

      setState(prev => ({
        ...prev,
        status: CampaignStatus.COMPLETED
      }));

    } catch (err) {
      console.error('Secure automation error:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, [campaignId, mode, secureApiService]);

  const resetAutomation = useCallback(() => {
    setState({
      status: CampaignStatus.INITIATED,
      selectedCreators: [],
      sentContracts: [],
      communications: [],
      creatorPreferences: []
    });
    setError(null);
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
