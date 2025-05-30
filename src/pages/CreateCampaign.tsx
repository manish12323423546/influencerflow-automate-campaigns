
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InfluencerSearchModal } from '@/components/InfluencerSearchModal';

const CreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goals: '',
    target_audience: '',
    budget: '',
    deliverables: '',
    timeline: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCampaign = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a campaign name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name,
          description: formData.description || null,
          goals: formData.goals || null,
          target_audience: formData.target_audience || null,
          budget: parseFloat(formData.budget) || 0,
          deliverables: formData.deliverables || null,
          timeline: formData.timeline || null,
          status: 'draft',
          user_id: user.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add selected influencers to campaign
      if (selectedInfluencers.length > 0) {
        const campaignInfluencers = selectedInfluencers.map(influencerId => ({
          campaign_id: campaign.id,
          influencer_id: influencerId,
          status: 'shortlisted',
        }));

        const { error: influencersError } = await supabase
          .from('campaign_influencers')
          .insert(campaignInfluencers);

        if (influencersError) throw influencersError;
      }

      toast({
        title: "Campaign created successfully",
        description: `${formData.name} has been created with ${selectedInfluencers.length} influencer(s).`,
      });

      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error creating campaign",
        description: "There was a problem creating your campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInfluencers = (influencerIds: string[]) => {
    setSelectedInfluencers(prev => {
      const newIds = influencerIds.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  };

  const handleRemoveInfluencer = (influencerId: string) => {
    setSelectedInfluencers(prev => prev.filter(id => id !== influencerId));
  };

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/campaigns" 
                className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Campaigns
              </Link>
              <h1 className="text-2xl font-space font-bold text-snow">
                Create New Campaign
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Campaign Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter campaign name"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your campaign"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Campaign Goals
                  </label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="What do you want to achieve?"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Target Audience
                  </label>
                  <Textarea
                    value={formData.target_audience}
                    onChange={(e) => handleInputChange('target_audience', e.target.value)}
                    placeholder="Describe your target audience"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Budget ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="0"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Deliverables
                  </label>
                  <Textarea
                    value={formData.deliverables}
                    onChange={(e) => handleInputChange('deliverables', e.target.value)}
                    placeholder="What content/deliverables do you expect?"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Timeline
                  </label>
                  <Input
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    placeholder="e.g., 4 weeks, Q1 2024"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Selected Influencers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => setSearchModalOpen(true)}
                    variant="outline"
                    className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    Add Influencers
                  </Button>
                  
                  {selectedInfluencers.length === 0 ? (
                    <p className="text-sm text-snow/60 text-center py-4">
                      No influencers selected yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedInfluencers.map((influencerId) => (
                        <div
                          key={influencerId}
                          className="flex items-center justify-between p-2 bg-zinc-800 rounded"
                        >
                          <span className="text-sm text-snow">Influencer {influencerId.slice(0, 8)}...</span>
                          <Button
                            onClick={() => handleRemoveInfluencer(influencerId)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <Button
                  onClick={handleCreateCampaign}
                  disabled={isSubmitting}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Influencer Search Modal */}
      <InfluencerSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectInfluencers={handleAddInfluencers}
        selectedInfluencers={selectedInfluencers}
      />
    </div>
  );
};

export default CreateCampaign;
