import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users, Target, DollarSign, Calendar, FileText, AlertCircle, Search, Loader2 } from 'lucide-react';
import { InfluencerSearchModal } from '@/components/InfluencerSearchModal';
import { findMatchingInfluencers } from '@/lib/openai';
import { supabase } from '@/integrations/supabase/client';
import type { Influencer } from '@/types/influencer';

interface InfluencerWithMatch extends Influencer {
  match_score?: number;
  match_reason?: string;
}

const STORAGE_KEY = 'campaign_draft';

// Default anonymous user ID for non-authenticated campaigns
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isMatchingInfluencers, setIsMatchingInfluencers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize state from localStorage if available
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { formData } = JSON.parse(saved);
      return formData;
    }
    return {
      name: '',
      description: '',
      goals: '',
      target_audience: '',
      budget: '',
      deliverables: '',
      timeline: '',
      brand: '',
      status: 'draft' as const,
    };
  });

  const [selectedInfluencers, setSelectedInfluencers] = useState<InfluencerWithMatch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { selectedInfluencers } = JSON.parse(saved);
      return selectedInfluencers;
    }
    return [];
  });

  // Save to localStorage whenever form data or selected influencers change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      formData,
      selectedInfluencers
    }));
  }, [formData, selectedInfluencers]);

  // Clear localStorage after successful campaign creation
  const clearStoredData = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

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

  const handleFindInfluencers = async () => {
    if (!validateForm()) {
      toast({
        title: "Please complete the form",
        description: "We need campaign details to find matching influencers.",
        variant: "destructive",
      });
      return;
    }

    setIsMatchingInfluencers(true);
    try {
      // Fetch all influencers from Supabase
      const { data: allInfluencers, error } = await supabase
        .from('influencers')
        .select('*')
        .order('followers_count', { ascending: false });

      if (error) throw error;
      if (!allInfluencers) throw new Error('No influencers found');
      
      // Use OpenRouter to find matches
      const matches = await findMatchingInfluencers({
        ...formData,
        budget: parseFloat(formData.budget)
      }, allInfluencers as Influencer[]);

      // Fetch full influencer details for matches
      const { data: matchedInfluencers, error: matchError } = await supabase
        .from('influencers')
        .select('*')
        .in('id', matches.matches.map(m => m.influencer_id));

      if (matchError) throw matchError;
      if (!matchedInfluencers) throw new Error('Failed to fetch matched influencers');

      // Add match scores and reasons to the influencer objects
      const enrichedInfluencers = matchedInfluencers.map(inf => {
        const match = matches.matches.find(m => m.influencer_id === inf.id);
        return {
          ...(inf as Influencer),
          match_score: match?.match_score || 0,
          match_reason: match?.match_reason || ''
        };
      });

      setSelectedInfluencers(enrichedInfluencers);
      
      toast({
        title: "Found matching influencers",
        description: `Found ${enrichedInfluencers.length} influencers that match your campaign.`,
      });
    } catch (error) {
      console.error('Error finding influencers:', error);
      toast({
        title: "Error finding influencers",
        description: "Please try again or select influencers manually.",
        variant: "destructive",
      });
    } finally {
      setIsMatchingInfluencers(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    if (selectedInfluencers.length === 0) {
      toast({
        title: "No influencers selected",
        description: "Please select at least one influencer for your campaign.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the campaign in Supabase without requiring auth
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: ANONYMOUS_USER_ID,
          name: formData.name,
          brand: formData.brand,
          description: formData.description,
          goals: formData.goals,
          target_audience: formData.target_audience,
          budget: parseFloat(formData.budget),
          deliverables: formData.deliverables,
          timeline: formData.timeline,
          status: formData.status,
          influencer_count: selectedInfluencers.length,
          spent: 0,
          reach: selectedInfluencers.reduce((sum, inf) => sum + inf.followers_count, 0),
          engagement_rate: selectedInfluencers.reduce((sum, inf) => sum + inf.engagement_rate, 0) / selectedInfluencers.length,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;
      if (!campaign) throw new Error('Failed to create campaign');

      // Create campaign-influencer relationships
      const { error: relationError } = await supabase
        .from('campaign_influencers')
        .insert(
          selectedInfluencers.map(inf => ({
            campaign_id: campaign.id,
            influencer_id: inf.id,
            status: 'pending',
            match_score: inf.match_score,
            match_reason: inf.match_reason,
            fee: 0, // Default fee value
          }))
        );

      if (relationError) throw relationError;

      // Clear stored data after successful creation
      clearStoredData();

      toast({
        title: "Campaign created successfully",
        description: `${formData.name} has been created with ${selectedInfluencers.length} influencer(s).`,
      });

      navigate(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error creating campaign",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInfluencers = (influencers: Influencer[]) => {
    setSelectedInfluencers(prev => {
      const newInfluencers = influencers.filter(
        inf => !prev.some(p => p.id === inf.id)
      );
      return [...prev, ...newInfluencers];
    });
  };

  const handleRemoveInfluencer = (influencerId: string) => {
    setSelectedInfluencers(prev => prev.filter(inf => inf.id !== influencerId));
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

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter campaign description"
                    className="bg-zinc-800 border-zinc-700 text-snow min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Goals *
                  </label>
                  <Textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    placeholder="What are your campaign goals?"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.goals ? 'border-red-500' : ''}`}
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
                    placeholder="Describe your target audience"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.target_audience ? 'border-red-500' : ''}`}
                  />
                  {errors.target_audience && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.target_audience}
                    </p>
                  )}
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
                      Timeline
                    </label>
                    <Input
                      value={formData.timeline}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      placeholder="e.g., 2 weeks, 1 month"
                      className="bg-zinc-800 border-zinc-700 text-snow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Deliverables *
                  </label>
                  <Textarea
                    value={formData.deliverables}
                    onChange={(e) => handleInputChange('deliverables', e.target.value)}
                    placeholder="What do you expect from influencers?"
                    className={`bg-zinc-800 border-zinc-700 text-snow ${errors.deliverables ? 'border-red-500' : ''}`}
                  />
                  {errors.deliverables && (
                    <p className="text-red-400 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.deliverables}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Influencer Selection */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-500" />
                    Selected Influencers
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleFindInfluencers}
                      disabled={isMatchingInfluencers}
                      className="bg-zinc-800 border-zinc-700 text-snow hover:bg-zinc-700"
                    >
                      {isMatchingInfluencers ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Find Matching Influencers
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSearchModalOpen(true)}
                      className="bg-zinc-800 border-zinc-700 text-snow hover:bg-zinc-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Browse All
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedInfluencers.length === 0 ? (
                  <div className="text-center py-8 text-snow/70">
                    No influencers selected yet. Click "Find Matching Influencers" or browse all.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedInfluencers.map((influencer) => (
                      <div
                        key={influencer.id}
                        className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {influencer.avatar_url && (
                            <img
                              src={influencer.avatar_url}
                              alt={influencer.name}
                              className="h-10 w-10 rounded-full"
                            />
                          )}
                          <div>
                            <h3 className="text-snow font-medium">{influencer.name}</h3>
                            <p className="text-snow/70 text-sm">
                              {influencer.platform} • {influencer.followers_count.toLocaleString()} followers
                            </p>
                            {'match_score' in influencer && (
                              <p className="text-xs text-purple-400 mt-1">
                                Match Score: {influencer.match_score}% - {influencer.match_reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInfluencer(influencer.id)}
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-snow/70">Selected Influencers</p>
                  <p className="text-2xl font-bold text-snow">{selectedInfluencers.length}</p>
                </div>
                <div>
                  <p className="text-sm text-snow/70">Total Budget</p>
                  <p className="text-2xl font-bold text-snow">
                    ${formData.budget ? parseFloat(formData.budget).toLocaleString() : '0'}
                  </p>
                </div>
                <Button
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handleCreateCampaign}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InfluencerSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleAddInfluencers}
      />
    </div>
  );
};

export default CreateCampaign;
