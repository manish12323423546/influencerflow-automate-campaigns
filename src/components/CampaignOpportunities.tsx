
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, DollarSign, Clock, MapPin, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CampaignOffer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  brand_name: string;
  campaign_name: string;
  brief: string;
  rate: number;
  deadline: string;
  status: 'pending' | 'accepted' | 'declined' | 'negotiating';
  created_at: string;
  brand_logo?: string;
  deliverables: string[];
  platform: string;
  location?: string;
}

// Mock campaign opportunities using existing Supabase data structure
const mockCampaignOffers: CampaignOffer[] = [
  {
    id: '1',
    campaign_id: '1',
    influencer_id: 'mock-creator-123',
    brand_name: 'TechCorp',
    campaign_name: 'Tech Product Launch',
    brief: 'We are launching our revolutionary new smartphone and need authentic creators to showcase its features. Looking for creative content that highlights the camera quality, battery life, and sleek design.',
    rate: 2500,
    deadline: '2024-02-15',
    status: 'pending',
    created_at: '2024-01-20T10:00:00Z',
    brand_logo: '/placeholder.svg',
    deliverables: ['3 Instagram posts', '1 Reel', '5 Stories'],
    platform: 'Instagram',
    location: 'Remote'
  },
  {
    id: '2',
    campaign_id: '2',
    influencer_id: 'mock-creator-123',
    brand_name: 'StyleBrand',
    campaign_name: 'Fashion Summer Collection',
    brief: 'Promote our new summer collection with vibrant, lifestyle-focused content. We want to see the clothes in everyday settings that resonate with young professionals.',
    rate: 1800,
    deadline: '2024-03-01',
    status: 'negotiating',
    created_at: '2024-01-18T14:30:00Z',
    brand_logo: '/placeholder.svg',
    deliverables: ['2 Instagram posts', '3 Stories', '1 IGTV'],
    platform: 'Instagram',
    location: 'New York, NY'
  },
  {
    id: '3',
    campaign_id: '3',
    influencer_id: 'mock-creator-123',
    brand_name: 'FitLife',
    campaign_name: 'Fitness App Promotion',
    brief: 'Help us promote our new fitness app with workout content and app demonstrations. Show real usage scenarios and highlight the personal training features.',
    rate: 3200,
    deadline: '2024-02-28',
    status: 'pending',
    created_at: '2024-01-19T09:15:00Z',
    brand_logo: '/placeholder.svg',
    deliverables: ['2 YouTube videos', '4 Instagram posts', '10 Stories'],
    platform: 'Multi-platform',
    location: 'Remote'
  }
];

const CampaignOpportunities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [opportunities, setOpportunities] = useState<CampaignOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock query for campaign opportunities using existing data structure
  const { data: campaignOpportunities = [], isLoading: queryLoading } = useQuery({
    queryKey: ['campaign-opportunities'],
    queryFn: async () => {
      // Simulate API call by fetching from campaigns and campaign_influencers tables
      console.log('Fetching campaign opportunities...');
      
      // In a real scenario, this would join campaigns with campaign_influencers
      // where the current user is the influencer and status is 'pending' or 'negotiating'
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_influencers!inner(
            id,
            status,
            fee,
            influencer_id
          )
        `)
        .eq('campaign_influencers.status', 'shortlisted');
      
      if (error) {
        console.error('Error fetching opportunities:', error);
        // Return mock data if Supabase fails
        return mockCampaignOffers;
      }
      
      // Transform the data to match our interface
      const transformedData = campaigns?.map(campaign => ({
        id: campaign.id,
        campaign_id: campaign.id,
        influencer_id: 'mock-creator-123',
        brand_name: campaign.brand,
        campaign_name: campaign.name,
        brief: campaign.description || 'No description provided',
        rate: campaign.budget / 10, // Simulate individual rate
        deadline: '2024-02-28',
        status: 'pending' as const,
        created_at: campaign.created_at,
        brand_logo: '/placeholder.svg',
        deliverables: campaign.deliverables?.split(',') || ['Content creation'],
        platform: 'Multi-platform',
        location: 'Remote'
      })) || [];

      return transformedData.length > 0 ? transformedData : mockCampaignOffers;
    },
  });

  useEffect(() => {
    setOpportunities(campaignOpportunities);
    setIsLoading(queryLoading);
  }, [campaignOpportunities, queryLoading]);

  // Mutation to update campaign offer status
  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, status, campaignId }: { offerId: string; status: string; campaignId: string }) => {
      // Update in Supabase campaign_influencers table
      const { data, error } = await supabase
        .from('campaign_influencers')
        .update({ status })
        .eq('campaign_id', campaignId)
        .eq('influencer_id', 'mock-creator-123')
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        // Continue with mock behavior for demo
      }
      
      return { offerId, status };
    },
    onSuccess: ({ offerId, status }) => {
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === offerId ? { ...opp, status: status as any } : opp
        )
      );
      
      const statusMessages = {
        'accepted': 'Opportunity accepted! The brand will be notified.',
        'declined': 'Opportunity declined.',
        'negotiating': 'Negotiation started. You can discuss terms with the brand.'
      };
      
      toast({
        title: "Status updated",
        description: statusMessages[status as keyof typeof statusMessages],
      });
      
      queryClient.invalidateQueries({ queryKey: ['campaign-opportunities'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const handleAccept = (offerId: string, campaignId: string) => {
    updateOfferMutation.mutate({ offerId, status: 'accepted', campaignId });
  };

  const handleDecline = (offerId: string, campaignId: string) => {
    updateOfferMutation.mutate({ offerId, status: 'declined', campaignId });
  };

  const handleNegotiate = (offerId: string, campaignId: string) => {
    updateOfferMutation.mutate({ offerId, status: 'negotiating', campaignId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/10 text-green-500';
      case 'declined':
        return 'bg-red-500/10 text-red-500';
      case 'negotiating':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-blue-500/10 text-blue-500';
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-snow">Campaign Opportunities</h2>
          <p className="text-snow/60">Brand collaboration offers waiting for your response</p>
        </div>
        <Badge className="bg-purple-500/10 text-purple-500">
          {opportunities.filter(opp => opp.status === 'pending').length} pending
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-snow/60">
          Loading opportunities...
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-snow/30" />
            <h3 className="text-lg font-medium text-snow mb-2">No opportunities yet</h3>
            <p className="text-snow/60">
              Brands will send collaboration offers here. Make sure your profile is complete to attract more opportunities!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={opportunity.brand_logo} alt={opportunity.brand_name} />
                        <AvatarFallback className="bg-purple-500 text-white">
                          {opportunity.brand_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-snow">{opportunity.campaign_name}</h3>
                        <p className="text-snow/60">{opportunity.brand_name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-snow/50 flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${opportunity.rate.toLocaleString()}
                          </span>
                          <span className="text-sm text-snow/50 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDeadline(opportunity.deadline)}
                          </span>
                          {opportunity.location && (
                            <span className="text-sm text-snow/50 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {opportunity.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(opportunity.status)}>
                      {opportunity.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-snow mb-2">Campaign Brief</h4>
                    <p className="text-snow/80 text-sm leading-relaxed">{opportunity.brief}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-snow mb-2">Deliverables</h4>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.deliverables.map((deliverable, idx) => (
                        <Badge key={idx} variant="outline" className="border-zinc-700 text-snow/70">
                          {deliverable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-4">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                      {opportunity.platform}
                    </Badge>
                    <span className="text-xs text-snow/50">
                      Received {new Date(opportunity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {opportunity.status === 'pending' && (
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={() => handleAccept(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleNegotiate(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 flex-1"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Negotiate
                      </Button>
                      <Button
                        onClick={() => handleDecline(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10 flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {opportunity.status === 'negotiating' && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Continue Negotiation
                      </Button>
                    </div>
                  )}
                  
                  {opportunity.status === 'accepted' && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full border-green-500 text-green-500 hover:bg-green-500/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Campaign Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignOpportunities;
