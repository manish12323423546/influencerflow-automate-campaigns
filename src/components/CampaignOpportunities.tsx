
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Campaign Opportunities</h2>
          <p className="text-sm sm:text-base text-gray-600">Brand collaboration offers waiting for your response</p>
        </div>
        <Badge className="bg-coral/10 text-coral self-start sm:self-auto text-xs sm:text-sm">
          {opportunities.filter(opp => opp.status === 'pending').length} pending
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="text-center py-8 sm:py-12">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              Brands will send collaboration offers here. Make sure your profile is complete to attract more opportunities!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {opportunities.map((opportunity, index) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white border-gray-200 hover:border-coral/50 transition-colors shadow-sm hover:shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={opportunity.brand_logo} alt={opportunity.brand_name} />
                        <AvatarFallback className="bg-coral text-white text-sm">
                          {opportunity.brand_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{opportunity.campaign_name}</h3>
                        <p className="text-gray-600 text-sm sm:text-base">{opportunity.brand_name}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                          <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            ${opportunity.rate.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">{formatDeadline(opportunity.deadline)}</span>
                            <span className="sm:hidden">{formatDeadline(opportunity.deadline).replace(' left', '')}</span>
                          </span>
                          {opportunity.location && (
                            <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {opportunity.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={`${getStatusColor(opportunity.status)} self-start lg:self-auto text-xs sm:text-sm`}>
                      {opportunity.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Campaign Brief</h4>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{opportunity.brief}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Deliverables</h4>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {opportunity.deliverables.map((deliverable, idx) => (
                        <Badge key={idx} variant="outline" className="border-gray-300 text-gray-600 text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pt-2 sm:pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                        {opportunity.platform}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Received {new Date(opportunity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {opportunity.status === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <Button
                        onClick={() => handleAccept(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        className="bg-green-500 hover:bg-green-600 flex-1 text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleNegotiate(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        variant="outline"
                        className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 flex-1 text-xs sm:text-sm"
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Negotiate
                      </Button>
                      <Button
                        onClick={() => handleDecline(opportunity.id, opportunity.campaign_id)}
                        disabled={updateOfferMutation.isPending}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10 flex-1 text-xs sm:text-sm"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {opportunity.status === 'negotiating' && (
                    <div className="pt-3 sm:pt-4">
                      <Button
                        variant="outline"
                        className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10 text-xs sm:text-sm"
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Continue Negotiation
                      </Button>
                    </div>
                  )}
                  
                  {opportunity.status === 'accepted' && (
                    <div className="pt-3 sm:pt-4">
                      <Button
                        onClick={() => navigate(`/creator-campaigns/${opportunity.id}`)}
                        variant="outline"
                        className="w-full border-green-500 text-green-500 hover:bg-green-500/10 text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
