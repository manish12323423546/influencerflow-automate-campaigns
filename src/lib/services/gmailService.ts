import { supabase } from '@/integrations/supabase/client';

export interface GmailCreator {
  id: string;
  name: string;
  gmail_gmail: string | null;
  handle?: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
}

export interface GmailCampaign {
  id: string;
  name: string;
  brand: string;
  description?: string;
  goals?: string;
  target_audience?: string;
  budget: number;
  deliverables?: string;
  timeline?: string;
}

export interface GmailResponse {
  status: 'success' | 'error';
  timestamp: string;
  response?: any;
  error?: string;
}

export class GmailService {
  private static readonly WEBHOOK_URL = "https://sdsd12.app.n8n.cloud/webhook-test/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4";

  static async sendGmailWorkflow(
    creator: GmailCreator,
    campaign: GmailCampaign,
    contractData?: any
  ): Promise<GmailResponse> {
    try {
      if (!creator.gmail_gmail) {
        throw new Error(`No Gmail address found for ${creator.name}`);
      }

      // Get contract data from Supabase if not provided
      let contract = contractData;
      if (!contract) {
        const { data: contractDataFromDB } = await supabase
          .from('contracts')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('influencer_id', creator.id)
          .maybeSingle();

        contract = contractDataFromDB;
      }

      // Calculate campaign dates
      const startDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Prepare request body in the exact format expected by the webhook
      const requestBody = {
        campaignDetail: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          brandName: campaign.brand,
          campaignDescription: campaign.description || '',
          campaignGoals: campaign.goals || '',
          targetAudience: campaign.target_audience || '',
          budget: campaign.budget,
          deliverables: campaign.deliverables || '',
          timeline: campaign.timeline || '',
          contractDetails: contract ? [
            {
              contractId: contract.id || 'pending',
              terms: contract.contract_data?.terms || {
                deliverables: campaign.deliverables || 'Content creation and posting',
                timeline: campaign.timeline || '30 days',
                compensation: 'To be negotiated'
              },
              status: contract.status || 'draft',
              createdAt: contract.created_at || new Date().toISOString()
            }
          ] : []
        },
        influencerDetail: {
          influencerId: creator.id,
          name: creator.name,
          gmail: creator.gmail_gmail,
          socialHandles: {
            [creator.platform]: creator.handle || `@${creator.name.toLowerCase().replace(/\s+/g, '')}`
          },
          followers: {
            [creator.platform]: creator.followers_count
          },
          engagementRate: {
            [creator.platform]: creator.engagement_rate
          },
          platform: creator.platform,
          totalFollowers: creator.followers_count,
          averageEngagement: creator.engagement_rate
        },
        campaignTimeline: {
          startDate: startDate,
          endDate: endDate,
          duration: `${startDate} to ${endDate}`
        }
      };

      console.log('Sending Gmail workflow with data:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        response: responseData
      };

    } catch (error) {
      console.error('Error sending Gmail workflow:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async sendBulkGmailWorkflow(
    creators: GmailCreator[],
    campaign: GmailCampaign,
    onProgress?: (creator: GmailCreator, result: GmailResponse) => void
  ): Promise<Record<string, GmailResponse>> {
    const results: Record<string, GmailResponse> = {};

    for (const creator of creators) {
      if (!creator.gmail_gmail) {
        const errorResult: GmailResponse = {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: `No Gmail address found for ${creator.name}`
        };
        results[creator.id] = errorResult;
        onProgress?.(creator, errorResult);
        continue;
      }

      try {
        const result = await this.sendGmailWorkflow(creator, campaign);
        results[creator.id] = result;
        onProgress?.(creator, result);

        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        const errorResult: GmailResponse = {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results[creator.id] = errorResult;
        onProgress?.(creator, errorResult);
      }
    }

    return results;
  }
}
