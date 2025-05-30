
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users, Target, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { InfluencerSearchModal } from '@/components/InfluencerSearchModal';

const CreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goals: '',
    target_audience: '',
    budget: '',
    deliverables: '',
    timeline: '',
    brand: '',
    status: 'draft',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand name is required';
    }
    
    if (!formData.goals.trim()) {
      newErrors.goals = 'Campaign goals are required';
    }
    
    if (!formData.target_audience.trim()) {
      newErrors.target_audience = 'Target audience is required';
    }
    
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Valid budget amount is required';
    }
    
    if (!formData.deliverables.trim()) {
      newErrors.deliverables = 'Deliverables are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCampaign = async () => {
    if (!user) return;

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
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
          goals: formData.goals,
          target_audience: formData.target_audience,
          budget: parseFloat(formData.budget),
          deliverables: formData.deliverables,
          timeline: formData.timeline || null,
          brand: formData.brand,
          status: formData.status,
          user_id: user.id,
          influencer_count: selectedInfluencers.length,
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
          fee: 0,
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-500" />
                  Campaign Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Campaign Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter campaign name"
                      className={`bg-zinc-800 border-zinc-700 text-snow ${errors.name ? 'border-red-500' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Brand Name *
                    </label>
                    <Input
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Enter brand name"
                      className={`bg-zinc-800 border-zinc-700 text-snow ${errors.brand ? 'border-red-500' : ''}`}
                    />
                    {errors.brand && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Budget ($) *
                    </label>
                    <Input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      placeholder="0"
                      className={`bg-zinc-800 border-zinc-700 text-snow ${errors.budget ? 'border-red-500' : ''}`}
                    />
                    {errors.budget && (
                      <p className="text-red-400 text-sm mt-1 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.budget}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-snow mb-2">
                      Status
                    </label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Campaign Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your campaign"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Goals and Audience */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-500" />
                  Goals & Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Campaign Goals *
                  </label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="What do you want to achieve with this campaign?"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.goals ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.goals && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.goals}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Target Audience *
                  </label>
                  <Textarea
                    value={formData.target_audience}
                    onChange={(e) => handleInputChange('target_audience', e.target.value)}
                    placeholder="Describe your target audience (demographics, interests, etc.)"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.target_audience ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.target_audience && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.target_audience}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Deliverables and Timeline */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-500" />
                  Deliverables & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Deliverables *
                  </label>
                  <Textarea
                    value={formData.deliverables}
                    onChange={(e) => handleInputChange('deliverables', e.target.value)}
                    placeholder="What content/deliverables do you expect? (e.g., 1 Instagram post, 3 stories, 1 reel)"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.deliverables ? 'border-red-500' : ''}`}
                    rows={3}
                  />
                  {errors.deliverables && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.deliverables}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Timeline
                  </label>
                  <Input
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    placeholder="e.g., 4 weeks, Q1 2024, March 2024"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Influencers */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-500" />
                  Selected Influencers ({selectedInfluencers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() => setSearchModalOpen(true)}
                    variant="outline"
                    className="w-full border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add Influencers
                  </Button>
                  
                  {selectedInfluencers.length === 0 ? (
                    <p className="text-sm text-snow/60 text-center py-4">
                      No influencers selected yet. Add influencers to your campaign.
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

            {/* Campaign Summary */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-purple-500" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-snow/70">Budget:</span>
                  <span className="text-snow font-medium">
                    ${formData.budget ? parseFloat(formData.budget).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-snow/70">Influencers:</span>
                  <span className="text-snow font-medium">{selectedInfluencers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-snow/70">Status:</span>
                  <span className="text-snow font-medium capitalize">{formData.status}</span>
                </div>
              </CardContent>
            </Card>

            {/* Create Campaign Button */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <Button
                  onClick={handleCreateCampaign}
                  disabled={isSubmitting}
                  className="w-full bg-purple-500 hover:bg-purple-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creating Campaign...' : 'Create Campaign'}
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
