import { supabase } from '@/integrations/supabase/client';

export interface ActiveInfluencer {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  campaign_status: string;
  campaign: {
    id: string;
    name: string;
    brand: string;
  };
}

export interface InfluencerWithConversation extends ActiveInfluencer {
  hasConversation: boolean;
  conversationId?: string;
}

class InfluencerService {
  /**
   * Get all active campaign influencers
   */
  async getActiveCampaignInfluencers(): Promise<ActiveInfluencer[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select(`
          id,
          status,
          campaign:campaigns!inner (
            id,
            name,
            brand,
            status
          ),
          influencer:influencers!inner (
            id,
            name,
            handle,
            avatar_url,
            platform,
            followers_count,
            engagement_rate
          )
        `)
        .eq('campaign.status', 'active')
        .in('status', ['active', 'pending', 'accepted']);

      if (error) throw error;

      // Transform the data
      const influencers: ActiveInfluencer[] = (data || []).map((item: any) => ({
        id: item.influencer.id,
        name: item.influencer.name,
        handle: item.influencer.handle,
        avatar_url: item.influencer.avatar_url,
        platform: item.influencer.platform,
        followers_count: item.influencer.followers_count,
        engagement_rate: item.influencer.engagement_rate,
        campaign_status: item.status,
        campaign: {
          id: item.campaign.id,
          name: item.campaign.name,
          brand: item.campaign.brand,
        },
      }));

      // Remove duplicates (same influencer in multiple campaigns)
      const uniqueInfluencers = influencers.reduce((acc: ActiveInfluencer[], current) => {
        const existing = acc.find(inf => inf.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      return uniqueInfluencers;
    } catch (error) {
      console.error('Error fetching active campaign influencers:', error);
      throw error;
    }
  }

  /**
   * Get active influencers with their conversation status
   */
  async getInfluencersWithConversationStatus(): Promise<InfluencerWithConversation[]> {
    try {
      const influencers = await this.getActiveCampaignInfluencers();

      if (influencers.length === 0) {
        return [];
      }

      // Get existing conversations (without user filtering for now)
      const { data: conversations, error: convError } = await supabase
        .from('chat_participants')
        .select(`
          conversation_id,
          influencer_id,
          chat_conversations!inner(id)
        `)
        .not('influencer_id', 'is', null);

      if (convError) {
        console.error('Error fetching conversations:', convError);
        // Continue without conversation data
      }

      // Map influencers with conversation status
      const influencersWithStatus: InfluencerWithConversation[] = influencers.map(influencer => {
        const existingConv = conversations?.find(conv => conv.influencer_id === influencer.id);
        return {
          ...influencer,
          hasConversation: !!existingConv,
          conversationId: existingConv?.conversation_id,
        };
      });

      return influencersWithStatus;
    } catch (error) {
      console.error('Error fetching influencers with conversation status:', error);
      throw error;
    }
  }

  /**
   * Get influencers available for new conversations (no existing conversation)
   */
  async getAvailableInfluencersForChat(): Promise<InfluencerWithConversation[]> {
    try {
      const influencersWithStatus = await this.getInfluencersWithConversationStatus();
      return influencersWithStatus.filter(inf => !inf.hasConversation);
    } catch (error) {
      console.error('Error fetching available influencers:', error);
      throw error;
    }
  }

  /**
   * Search influencers by name or handle
   */
  searchInfluencers(influencers: InfluencerWithConversation[], query: string): InfluencerWithConversation[] {
    if (!query.trim()) return influencers;
    
    const searchTerm = query.toLowerCase();
    return influencers.filter(inf => 
      inf.name.toLowerCase().includes(searchTerm) ||
      inf.handle.toLowerCase().includes(searchTerm) ||
      inf.platform.toLowerCase().includes(searchTerm)
    );
  }
}

export const influencerService = new InfluencerService();
