import { Tool } from "@langchain/core/tools";
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Campaign } from '@/types/campaign';
import type { Influencer } from '@/types/influencer';

export class SearchInfluencersTool extends Tool {
  name = "search_influencers";
  description = "Search for influencers based on criteria like niche, follower count, engagement rate, etc.";

  async _call(input: string) {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .textSearch('description', input);

      if (error) throw error;
      
      // Transform platform to match Influencer type
      const influencers = (data || []).map(influencer => ({
        ...influencer,
        platform: influencer.platform as Influencer['platform']
      }));

      return JSON.stringify(influencers);
    } catch (error) {
      return `Error searching influencers: ${error.message}`;
    }
  }
}

export class GetCampaignDetailsTool extends Tool {
  name = "get_campaign_details";
  description = "Get detailed information about a specific campaign";

  async _call(campaignId: string) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, campaign_influencers(*), posts(*)')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return JSON.stringify(data);
    } catch (error) {
      return `Error getting campaign details: ${error.message}`;
    }
  }
}

export class UpdateCampaignTool extends Tool {
  name = "update_campaign";
  description = "Update campaign status or details";

  async _call(input: string) {
    try {
      const { campaignId, updates } = JSON.parse(input);
      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (error) throw error;
      return "Campaign updated successfully";
    } catch (error) {
      return `Error updating campaign: ${error.message}`;
    }
  }
}

export class SendOutreachMessageTool extends Tool {
  name = "send_outreach_message";
  description = "Send an outreach message to an influencer";

  async _call(input: string) {
    try {
      const { influencerId, message, campaignId } = JSON.parse(input);
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: influencerId,
          title: 'New Campaign Opportunity',
          message,
          type: 'outreach',
          related_campaign_id: campaignId,
          is_read: false
        });

      if (error) throw error;
      return "Outreach message sent successfully";
    } catch (error) {
      return `Error sending outreach message: ${error.message}`;
    }
  }
}

export class GetInfluencerAnalyticsTool extends Tool {
  name = "get_influencer_analytics";
  description = "Get analytics and performance metrics for an influencer";

  async _call(influencerId: string) {
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select(`
          *,
          posts(
            engagement_rate,
            likes_count,
            comments_count,
            shares_count,
            views_count
          )
        `)
        .eq('id', influencerId)
        .single();

      if (error) throw error;
      return JSON.stringify(data);
    } catch (error) {
      return `Error getting influencer analytics: ${error.message}`;
    }
  }
}

export class CreateContractDraftTool extends Tool {
  name = "create_contract_draft";
  description = "Create a draft contract for an influencer campaign";

  async _call(input: string) {
    try {
      const { campaignId, influencerId, terms } = JSON.parse(input);
      const { error } = await supabase
        .from('contracts')
        .insert({
          campaign_id: campaignId,
          influencer_id: influencerId,
          contract_data: terms,
          status: 'draft',
          brand_user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
      return "Contract draft created successfully";
    } catch (error) {
      return `Error creating contract draft: ${error.message}`;
    }
  }
} 