import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  brand: string;
  created_at: string;
}

interface ShortlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencerId: string;
  influencerName: string;
}

export const ShortlistModal = ({
  open,
  onOpenChange,
  influencerId,
  influencerName,
}: ShortlistModalProps) => {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    description: '',
    budget: '',
    brand: '',
  });

  // Fetch user's campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['user-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name, description, status, brand, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: open,
  });

  const handleCreateAndAdd = async () => {
    if (!newCampaignData.name.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a campaign name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaignData.name,
          description: newCampaignData.description || null,
          budget: parseFloat(newCampaignData.budget) || 0,
          brand: newCampaignData.brand || 'Brand Name',
          status: 'draft',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add influencer to campaign
      const { error: influencerError } = await supabase
        .from('campaign_influencers')
        .insert({
          campaign_id: campaign.id,
          influencer_id: influencerId,
          status: 'shortlisted',
        });

      if (influencerError) throw influencerError;

      toast({
        title: "Success!",
        description: `${influencerName} has been shortlisted in the new campaign "${newCampaignData.name}".`,
      });

      setNewCampaignData({ name: '', description: '', budget: '', brand: '' });
      setShowCreateForm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating campaign and adding influencer:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign and add influencer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedCampaignId) {
      toast({
        title: "No campaign selected",
        description: "Please select a campaign to add the influencer to.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('campaign_influencers')
        .insert({
          campaign_id: selectedCampaignId,
          influencer_id: influencerId,
          status: 'shortlisted',
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already added",
            description: `${influencerName} is already in this campaign.`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
      toast({
        title: "Success!",
        description: `${influencerName} has been shortlisted in "${selectedCampaign?.name}".`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error adding influencer to campaign:', error);
      toast({
        title: "Error",
        description: "Failed to add influencer to campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-snow">
            Shortlist {influencerName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!showCreateForm ? (
            <>
              {/* Existing Campaigns */}
              <div>
                <h3 className="text-lg font-medium text-snow mb-4">
                  Add to Existing Campaign
                </h3>
                
                {isLoading ? (
                  <div className="text-center py-4 text-snow/60">Loading campaigns...</div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-4 text-snow/60">
                    <p className="mb-4">You don't have any campaigns yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCampaignId === campaign.id
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                        }`}
                        onClick={() => setSelectedCampaignId(campaign.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-snow">{campaign.name}</p>
                            {campaign.description && (
                              <p className="text-sm text-snow/60 mt-1">{campaign.description}</p>
                            )}
                            {campaign.brand && (
                              <p className="text-xs text-snow/50 mt-1">Brand: {campaign.brand}</p>
                            )}
                          </div>
                          <Badge className={getStatusBadgeColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {campaigns.length > 0 && (
                  <Button
                    onClick={handleAddToExisting}
                    disabled={!selectedCampaignId || isSubmitting}
                    className="w-full mt-4 bg-purple-500 hover:bg-purple-600"
                  >
                    {isSubmitting ? 'Adding...' : 'Add to Selected Campaign'}
                  </Button>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-900 text-snow/60">OR</span>
                </div>
              </div>

              {/* Create New Campaign Button */}
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Campaign
              </Button>
            </>
          ) : (
            <>
              {/* Create New Campaign Form */}
              <div>
                <h3 className="text-lg font-medium text-snow mb-4">
                  Create New Campaign
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Campaign Name *
                    </label>
                    <Input
                      value={newCampaignData.name}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Brand Name
                    </label>
                    <Input
                      value={newCampaignData.brand}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Enter brand name"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Description
                    </label>
                    <Textarea
                      value={newCampaignData.description}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your campaign"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Budget ($)
                    </label>
                    <Input
                      type="number"
                      value={newCampaignData.budget}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="0"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border-zinc-700 text-snow hover:bg-zinc-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateAndAdd}
                  disabled={isSubmitting || !newCampaignData.name.trim()}
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Add Influencer'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
