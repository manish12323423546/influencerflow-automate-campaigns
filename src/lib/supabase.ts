
import { supabase } from '@/integrations/supabase/client';
import type { Influencer } from '@/types/influencer';

export const fetchInfluencers = async (): Promise<Influencer[]> => {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .order('followers_count', { ascending: false });

  if (error) throw error;
  
  // Transform the data to match the Influencer type
  return (data || []).map(influencer => ({
    ...influencer,
    platform: influencer.platform as 'instagram' | 'tiktok' | 'youtube' | 'twitter'
  }));
};
