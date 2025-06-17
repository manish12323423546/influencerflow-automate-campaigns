import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const CampaignDebugger = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      console.log('User campaigns:', data);
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAllCampaigns(data || []);
      console.log('All campaigns:', data);
    } catch (error) {
      console.error('Error fetching all campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCampaigns();
    if (user) {
      fetchUserCampaigns();
    }
  }, [user]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Campaign Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs space-y-2">
          <div>User ID: {user?.id || 'Not logged in'}</div>
          <div>User Email: {user?.email || 'N/A'}</div>
          <div>User Campaigns: {campaigns.length}</div>
          <div>All Campaigns: {allCampaigns.length}</div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={fetchUserCampaigns} disabled={!user || loading}>
            Refresh User Campaigns
          </Button>
          <Button size="sm" onClick={fetchAllCampaigns} disabled={loading}>
            Refresh All Campaigns
          </Button>
        </div>

        {campaigns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Your Campaigns:</h4>
            <div className="space-y-1 text-xs">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-2 bg-gray-50 rounded">
                  <div>ID: {campaign.id}</div>
                  <div>Name: {campaign.name}</div>
                  <div>Brand: {campaign.brand}</div>
                  <div>User ID: {campaign.user_id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {allCampaigns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">All Campaigns (Sample):</h4>
            <div className="space-y-1 text-xs">
              {allCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="p-2 bg-gray-50 rounded">
                  <div>ID: {campaign.id}</div>
                  <div>Name: {campaign.name}</div>
                  <div>Brand: {campaign.brand}</div>
                  <div>User ID: {campaign.user_id}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
