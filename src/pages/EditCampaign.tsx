
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  goals: string | null;
  target_audience: string | null;
  budget: number;
  deliverables: string | null;
  timeline: string | null;
  status: string;
  brand: string;
}

const EditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goals: '',
    target_audience: '',
    budget: 0,
    deliverables: '',
    timeline: '',
    status: 'draft',
    brand: ''
  });

  // Fetch campaign data
  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) throw new Error('No campaign ID provided');
      
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!id,
  });

  // Update form data when campaign loads
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        goals: campaign.goals || '',
        target_audience: campaign.target_audience || '',
        budget: campaign.budget || 0,
        deliverables: campaign.deliverables || '',
        timeline: campaign.timeline || '',
        status: campaign.status || 'draft',
        brand: campaign.brand || ''
      });
    }
  }, [campaign]);

  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      if (!id) throw new Error('No campaign ID provided');
      
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Campaign updated successfully",
        description: "Your campaign has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate(`/campaigns/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error updating campaign",
        description: "There was a problem saving your campaign. Please try again.",
        variant: "destructive",
      });
      console.error('Update campaign error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCampaignMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-snow">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-snow">Campaign not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/campaigns/${id}`)}
                className="text-snow/70 hover:text-purple-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-snow">Edit Campaign</h1>
                <p className="text-sm text-snow/60">{campaign.name}</p>
              </div>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={updateCampaignMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateCampaignMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-snow">Campaign Details</CardTitle>
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
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Brand *
                  </label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand name"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-snow mb-2">
                    Budget *
                  </label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    placeholder="Enter budget amount"
                    className="bg-zinc-800 border-zinc-700 text-snow"
                    required
                  />
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  Goals
                </label>
                <Textarea
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  placeholder="What are your campaign goals?"
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
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-snow mb-2">
                  Deliverables
                </label>
                <Textarea
                  value={formData.deliverables}
                  onChange={(e) => handleInputChange('deliverables', e.target.value)}
                  placeholder="What deliverables do you expect?"
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
        </form>
      </div>
    </div>
  );
};

export default EditCampaign;
