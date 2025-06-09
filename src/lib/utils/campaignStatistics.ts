import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Manually recalculate statistics for a specific campaign
 * This function calls the database function to update campaign statistics
 */
export const recalculateCampaignStatistics = async (campaignId: string): Promise<boolean> => {
  try {
    logger.info(`Recalculating statistics for campaign: ${campaignId}`);
    
    const { error } = await supabase.rpc('update_campaign_statistics', {
      campaign_id_param: campaignId
    });

    if (error) {
      logger.error('Error recalculating campaign statistics:', error);
      return false;
    }

    logger.info(`Successfully recalculated statistics for campaign: ${campaignId}`);
    return true;
  } catch (error) {
    logger.error('Error in recalculateCampaignStatistics:', error);
    return false;
  }
};

/**
 * Recalculate statistics for all campaigns
 * This function calls the database function to update all campaign statistics
 */
export const recalculateAllCampaignStatistics = async (): Promise<number> => {
  try {
    logger.info('Recalculating statistics for all campaigns');
    
    const { data, error } = await supabase.rpc('recalculate_all_campaign_statistics');

    if (error) {
      logger.error('Error recalculating all campaign statistics:', error);
      return 0;
    }

    const updatedCount = data || 0;
    logger.info(`Successfully recalculated statistics for ${updatedCount} campaigns`);
    return updatedCount;
  } catch (error) {
    logger.error('Error in recalculateAllCampaignStatistics:', error);
    return 0;
  }
};

/**
 * Get calculated statistics for a campaign without updating the database
 * This function calls the database function to calculate statistics
 */
export const getCampaignStatistics = async (campaignId: string) => {
  try {
    logger.info(`Getting calculated statistics for campaign: ${campaignId}`);
    
    const { data, error } = await supabase.rpc('calculate_campaign_statistics', {
      campaign_id_param: campaignId
    });

    if (error) {
      logger.error('Error getting campaign statistics:', error);
      return null;
    }

    if (!data || data.length === 0) {
      logger.warn(`No statistics found for campaign: ${campaignId}`);
      return null;
    }

    const stats = data[0];
    logger.info(`Retrieved statistics for campaign ${campaignId}:`, stats);
    
    return {
      influencer_count: stats.influencer_count || 0,
      total_reach: stats.total_reach || 0,
      avg_engagement_rate: stats.avg_engagement_rate || 0,
      total_spent: stats.total_spent || 0
    };
  } catch (error) {
    logger.error('Error in getCampaignStatistics:', error);
    return null;
  }
};
