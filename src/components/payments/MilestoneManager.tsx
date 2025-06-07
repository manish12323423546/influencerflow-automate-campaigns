import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Campaign {
  name: string;
}

interface Influencer {
  name: string;
  handle: string;
}

interface Milestone {
  id: string;
  milestone_name: string;
  milestone_description: string;
  amount: number;
  due_date: string;
  status: string;
  campaign_id: string;
  influencer_id: string;
  campaigns: Campaign;
  influencers: Influencer;
  created_at: string;
  updated_at: string;
}

export const MilestoneManager: React.FC = () => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, [user]);

  const fetchMilestones = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_milestones')
        .select(`
          *,
          campaigns!inner(name),
          influencers!inner(name, handle)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Transform the data to match our Milestone interface
      const transformedMilestones = data?.map(milestone => ({
        ...milestone,
        campaigns: Array.isArray(milestone.campaigns) ? milestone.campaigns[0] : milestone.campaigns,
        influencers: Array.isArray(milestone.influencers) ? milestone.influencers[0] : milestone.influencers
      })) || [];

      setMilestones(transformedMilestones as Milestone[]);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to fetch milestones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Milestones</h2>
          <p className="text-muted-foreground">Track and manage campaign milestones</p>
        </div>
      </div>

      {loading ? (
        <p>Loading milestones...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {milestone.milestone_name}
                  <Badge variant="secondary">{milestone.status}</Badge>
                </CardTitle>
                <CardDescription>{milestone.milestone_description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>Amount: ${milestone.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Due Date: {formatDate(milestone.due_date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Influencer: {milestone.influencers?.name} ({milestone.influencers?.handle})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>Campaign: {milestone.campaigns?.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
