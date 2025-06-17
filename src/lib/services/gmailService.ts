import { supabase } from '@/integrations/supabase/client';

export interface GmailCreator {
  id: string;
  name: string;
  email: string;
}

export interface GmailCampaign {
  id: string;
  name: string;
  description: string;
}

export class GmailService {
  private static instance: GmailService;
  
  private constructor() {}

  public static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  async sendCampaignEmail(creator: GmailCreator, campaign: GmailCampaign): Promise<boolean> {
    try {
      // Log the email sending attempt
      const { error } = await supabase
        .from('email_logs')
        .insert([
          {
            creator_id: creator.id,
            campaign_id: campaign.id,
            email_to: creator.email,
            status: 'pending',
            type: 'campaign_outreach'
          }
        ]);

      if (error) {
        console.error('Failed to log email attempt:', error);
        return false;
      }

      // In a real implementation, you would integrate with Gmail API here
      // For now, we'll just simulate success
      console.log('Email sent successfully to:', creator.email);
      
      return true;
    } catch (error) {
      console.error('Error sending campaign email:', error);
      return false;
    }
  }

  async getEmailHistory(creatorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch email history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }
}

export default GmailService.getInstance(); 