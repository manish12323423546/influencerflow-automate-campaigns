
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EngagementUpdate {
  influencer_id: string;
  old_engagement_rate: number;
  new_engagement_rate: number;
  improvement_percentage: number;
}

export const useRealtimeEngagement = () => {
  const [engagementUpdates, setEngagementUpdates] = useState<EngagementUpdate[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          const newPost = payload.new;
          const oldPost = payload.old;
          
          // Calculate engagement improvement
          if (newPost.engagement_rate && oldPost.engagement_rate) {
            const improvement = ((newPost.engagement_rate - oldPost.engagement_rate) / oldPost.engagement_rate) * 100;
            
            // If engagement improved by 10% or more in the last hour
            if (improvement >= 10) {
              const update: EngagementUpdate = {
                influencer_id: newPost.influencer_id,
                old_engagement_rate: oldPost.engagement_rate,
                new_engagement_rate: newPost.engagement_rate,
                improvement_percentage: improvement
              };
              
              setEngagementUpdates(prev => [...prev, update]);
              
              // Remove the update after 5 seconds
              setTimeout(() => {
                setEngagementUpdates(prev => prev.filter(u => u !== update));
              }, 5000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { engagementUpdates };
};
