import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/types/campaign';

interface CampaignsManagerProps {
  campaigns: Campaign[];
}

const CampaignsManager = ({ campaigns: initialCampaigns }: CampaignsManagerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCampaignId, setLoadingCampaignId] = useState<string | null>(null);

  // Fetch campaign details from Supabase
  const fetchCampaignDetails = async (campaignId: string) => {
    try {
      setLoadingCampaignId(campaignId);
      
      // Fetch campaign with related data using existing relationships
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_influencers (
            id,
            fee,
            status,
            match_score,
            match_reason,
            influencer:influencers (
              id,
              handle,
              name,
              avatar_url,
              platform,
              followers_count,
              engagement_rate
            )
          )
        `)
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      if (!campaign) {
        toast({
          title: "Campaign not found",
          description: "The requested campaign could not be found.",
          variant: "destructive",
        });
        return;
      }

      // Navigate to view page with the data
      navigate(`/campaigns/${campaignId}`, {
        state: { campaignData: campaign }
      });

    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error loading campaign",
        description: "There was a problem loading the campaign details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingCampaignId(null);
    }
  };

  // Enhanced filtering logic
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!campaign.name?.toLowerCase().includes(searchLower) && 
          !campaign.brand?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false;
    }
    
    // Brand filter
    if (brandFilter !== 'all' && campaign.brand !== brandFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique brands for filter
  const uniqueBrands = [...new Set(campaigns.filter(c => c.brand).map(campaign => campaign.brand))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'completed':
        return 'text-blue-500 bg-blue-500/10';
      case 'draft':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'paused':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const handleViewCampaign = async (campaignId: string) => {
    await fetchCampaignDetails(campaignId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-coral pl-10 w-64 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900 shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>

          {/* Brand Filter */}
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-900 shadow-sm">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Campaign Button */}
        <Button
          onClick={() => navigate('/campaigns/create')}
          className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600">Campaign</TableHead>
                <TableHead className="text-gray-600">Brand</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Budget</TableHead>
                <TableHead className="text-gray-600">Spent</TableHead>
                <TableHead className="text-gray-600">Influencers</TableHead>
                <TableHead className="text-gray-600">Reach</TableHead>
                <TableHead className="text-gray-600">Engagement</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    {campaigns.length === 0
                      ? "No campaigns found. Create your first campaign to get started."
                      : "No campaigns match your current filters. Try adjusting your search criteria."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow
                    key={campaign.id}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    <TableCell className="font-medium text-gray-900">{campaign.name}</TableCell>
                    <TableCell className="text-gray-600">{campaign.brand}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">${campaign.budget?.toLocaleString() ?? 0}</TableCell>
                    <TableCell className="text-gray-600">${campaign.spent?.toLocaleString() ?? 0}</TableCell>
                    <TableCell className="text-gray-600">{campaign.influencer_count ?? 0}</TableCell>
                    <TableCell className="text-gray-600">{campaign.reach?.toLocaleString() ?? 0}</TableCell>
                    <TableCell className="text-gray-600">{campaign.engagement_rate?.toFixed(1) ?? 0}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleViewCampaign(campaign.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-coral hover:bg-coral/10"
                          disabled={loadingCampaignId === campaign.id}
                        >
                          {loadingCampaignId === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            'View'
                          )}
                        </Button>
                        <Button
                          onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-coral hover:bg-coral/10"
                          disabled={loadingCampaignId === campaign.id}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignsManager;
