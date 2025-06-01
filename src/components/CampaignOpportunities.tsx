
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
import { useNavigate } from 'react-router-dom';

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

const CampaignOpportunities = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [opportunities, setOpportunities] = useState<CampaignOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Query for campaign opportunities from Supabase
  const { data: campaignOpportunities = [], isLoading: queryLoading } = useQuery({
    queryKey: ['campaign-opportunities'],
    queryFn: async () => {
      console.log('Fetching campaign opportunities from Supabase...');
      
      const { data: campaignInfluencers, error } = await supabase
        .from('campaign_influencers')
        .select(`
          *,
          campaigns (
            id,
            name,
            brand,
            description,
            budget,
            timeline,
            deliverables,
            created_at
          )
        `)
        .in('status', ['shortlisted', 'pending'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching opportunities:', error);
        return [];
      }
      
      // Transform the data to match our interface
      return campaignInfluencers?.map(ci => ({
        id: ci.id,
        campaign_id: ci.campaign_id,
        influencer_id: ci.influencer_id,
        brand_name: ci.campaigns?.brand || 'Unknown Brand',
        campaign_name: ci.campaigns?.name || 'Unnamed Campaign',
        brief: ci.campaigns?.description || 'No description provided',
        rate: ci.fee || 0,
        deadline: '2024-03-15', // Default deadline, can be enhanced later
        status: ci.status === 'shortlisted' ? 'pending' as const : ci.status as any,
        created_at: ci.created_at,
        brand_logo: '/placeholder.svg',
        deliverables: ci.campaigns?.deliverables?.split(',') || ['Content creation'],
        platform: 'Multi-platform',
        location: 'Remote'
      })) || [];
    },
  });

  useEffect(() => {
    setOpportunities(campaignOpportunities);
    setIsLoading(queryLoading);
  }, [campaignOpportunities, queryLoading]);

  // Mutation to update campaign offer status
  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, status, campaignId }: { offerId: string; status: string; campaignId: string }) => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .update({ status })
        .eq('id', offerId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
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
      queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
      
      if (status === 'accepted') {
        setTimeout(() => {
          navigate(`/creator-campaigns/${offerId}`);
        }, 1500);
      }
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
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
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
                        onClick={() => navigate(`/creator-campaigns/${opportunity.id}`)}
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
