import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Users, Target } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  status: string;
  budget: number;
  goals: string | null;
  deliverables: string | null;
  timeline: string | null;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar_url: string;
  followers_count: number;
  engagement_rate: number;
  fee?: number;
  status?: string;
}

interface CampaignInfluencerSelectorProps {
  selectedCampaignId?: string;
  selectedInfluencerId?: string;
  onCampaignChange: (campaign: Campaign | null) => void;
  onInfluencerChange: (influencer: Influencer | null) => void;
}

export const CampaignInfluencerSelector = ({
  selectedCampaignId,
  selectedInfluencerId,
  onCampaignChange,
  onInfluencerChange,
}: CampaignInfluencerSelectorProps) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);

  // Fetch campaigns (allow without user authentication)
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        let query = supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        // If user is logged in, filter by user_id, otherwise get all campaigns
        if (user) {
          console.log('Fetching campaigns for user:', user.id);
          query = query.eq('user_id', user.id);
        } else {
          console.log('No user found, fetching all campaigns');
          query = query.limit(20); // Limit for performance
        }

        const { data, error } = await query;

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Fetched campaigns:', data);
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  // Fetch influencers for selected campaign
  useEffect(() => {
    const fetchInfluencers = async () => {
      if (!selectedCampaignId) {
        console.log('No campaign selected, clearing influencers');
        setInfluencers([]);
        return;
      }

      setLoadingInfluencers(true);
      try {
        console.log('Fetching influencers for campaign:', selectedCampaignId);

        const { data, error } = await supabase
          .from('campaign_influencers')
          .select(`
            id,
            fee,
            status,
            match_score,
            influencer:influencers (
              id,
              name,
              handle,
              platform,
              avatar_url,
              followers_count,
              engagement_rate
            )
          `)
          .eq('campaign_id', selectedCampaignId);

        if (error) {
          console.error('Supabase error fetching influencers:', error);
          throw error;
        }

        console.log('Raw influencer data:', data);

        const transformedInfluencers = data?.map((item: any) => ({
          id: item.influencer.id,
          name: item.influencer.name,
          handle: item.influencer.handle,
          platform: item.influencer.platform,
          avatar_url: item.influencer.avatar_url,
          followers_count: item.influencer.followers_count,
          engagement_rate: item.influencer.engagement_rate,
          fee: item.fee,
          status: item.status,
        })) || [];

        console.log('Transformed influencers:', transformedInfluencers);
        setInfluencers(transformedInfluencers);
      } catch (error) {
        console.error('Error fetching influencers:', error);
        setInfluencers([]);
      } finally {
        setLoadingInfluencers(false);
      }
    };

    fetchInfluencers();
  }, [selectedCampaignId]);

  const handleCampaignSelect = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId) || null;
    setSelectedCampaign(campaign);
    setSelectedInfluencer(null);
    onCampaignChange(campaign);
    onInfluencerChange(null);
  };

  const handleInfluencerSelect = (influencerId: string) => {
    const influencer = influencers.find(i => i.id === influencerId) || null;
    setSelectedInfluencer(influencer);
    onInfluencerChange(influencer);
  };

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-3 rounded text-xs">
          <div>User: {user ? user.id : 'Not logged in'}</div>
          <div>Campaigns: {campaigns.length}</div>
          <div>Loading Campaigns: {loadingCampaigns.toString()}</div>
          <div>Selected Campaign: {selectedCampaign?.name || 'None'}</div>
          <div>Influencers: {influencers.length}</div>
          <div>Loading Influencers: {loadingInfluencers.toString()}</div>
        </div>
      )}
      {/* Campaign Selection */}
      <div className="space-y-2">
        <Label htmlFor="campaign-select" className="text-sm font-medium text-gray-700">
          Select Campaign *
        </Label>
        <Select
          value={selectedCampaignId || ''}
          onValueChange={handleCampaignSelect}
          disabled={loadingCampaigns}
        >
          <SelectTrigger id="campaign-select" className="w-full border-gray-300 focus:border-coral focus:ring-coral">
            <SelectValue placeholder={
              loadingCampaigns
                ? "Loading campaigns..."
                : campaigns.length === 0
                  ? "No campaigns found"
                  : "Choose a campaign"
            } />
          </SelectTrigger>
          <SelectContent>
            {campaigns.length === 0 && !loadingCampaigns ? (
              <div className="p-2 text-sm text-gray-500">
                No campaigns found. Create a campaign first.
              </div>
            ) : (
              campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-coral" />
                    <span className="font-medium">{campaign.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {campaign.brand}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Details */}
      {selectedCampaign && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium">{selectedCampaign.brand}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget:</span>
              <span className="font-medium">₹{selectedCampaign.budget?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant="outline" className="text-xs">
                {selectedCampaign.status}
              </Badge>
            </div>
            {selectedCampaign.goals && (
              <div>
                <span className="text-gray-600">Goals:</span>
                <p className="text-xs text-gray-500 mt-1">{selectedCampaign.goals}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Influencer Selection */}
      {selectedCampaignId && (
        <div className="space-y-2">
          <Label htmlFor="influencer-select" className="text-sm font-medium text-gray-700">
            Select Influencer *
          </Label>
          <Select
            value={selectedInfluencerId || ''}
            onValueChange={handleInfluencerSelect}
            disabled={loadingInfluencers || influencers.length === 0}
          >
            <SelectTrigger id="influencer-select" className="w-full border-gray-300 focus:border-coral focus:ring-coral">
              <SelectValue
                placeholder={
                  loadingInfluencers
                    ? "Loading influencers..."
                    : influencers.length === 0
                      ? "No influencers found for this campaign"
                      : "Choose an influencer"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {influencers.map((influencer) => (
                <SelectItem key={influencer.id} value={influencer.id}>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={influencer.avatar_url} alt={influencer.name} />
                      <AvatarFallback className="text-xs">
                        {influencer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{influencer.name}</span>
                      <span className="text-xs text-gray-500">@{influencer.handle}</span>
                    </div>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {influencer.platform}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Influencer Details */}
      {selectedInfluencer && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Influencer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <Badge variant="outline" className="text-xs">
                {selectedInfluencer.platform}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Followers:</span>
              <span className="font-medium">{selectedInfluencer.followers_count?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Engagement Rate:</span>
              <span className="font-medium">{selectedInfluencer.engagement_rate}%</span>
            </div>
            {selectedInfluencer.fee && (
              <div className="flex justify-between">
                <span className="text-gray-600">Suggested Fee:</span>
                <span className="font-medium">₹{selectedInfluencer.fee.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {loadingCampaigns && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading campaigns...</span>
        </div>
      )}

      {loadingInfluencers && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading influencers...</span>
        </div>
      )}
    </div>
  );
};
