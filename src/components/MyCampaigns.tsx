
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Calendar, DollarSign, Clock, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MyCampaign {
  id: string;
  campaign_id: string;
  brand_name: string;
  campaign_name: string;
  brief: string;
  rate: number;
  deadline: string;
  status: 'accepted' | 'in_progress' | 'completed' | 'pending_review';
  created_at: string;
  brand_logo?: string;
  deliverables_count: number;
  completed_deliverables: number;
  platform: string;
  progress: number;
  payment_status: 'pending' | 'partial' | 'completed';
  next_deliverable_due?: string;
}

const MyCampaigns = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<MyCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Query to fetch user's campaigns from Supabase
  const { data: userCampaigns = [], isLoading: queryLoading } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: async () => {
      console.log('Fetching user campaigns from Supabase...');
      
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
        .in('status', ['accepted', 'confirmed'])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching campaigns:', error);
        return [];
      }
      
      // Transform Supabase data to match our interface
      return campaignInfluencers?.map(ci => ({
        id: ci.id,
        campaign_id: ci.campaign_id,
        brand_name: ci.campaigns?.brand || 'Unknown Brand',
        campaign_name: ci.campaigns?.name || 'Unnamed Campaign',
        brief: ci.campaigns?.description || 'No description available',
        rate: ci.fee || 0,
        deadline: '2024-03-15', // Default deadline
        status: 'in_progress' as const,
        created_at: ci.created_at,
        brand_logo: '/placeholder.svg',
        deliverables_count: 3,
        completed_deliverables: 1,
        platform: 'Instagram',
        progress: 33,
        payment_status: 'partial' as const,
        next_deliverable_due: '2024-02-10'
      })) || [];
    },
  });

  useEffect(() => {
    setCampaigns(userCampaigns);
    setIsLoading(queryLoading);
  }, [userCampaigns, queryLoading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'accepted':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'pending_review':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'partial':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'pending':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'active') return campaign.status !== 'completed';
    if (filter === 'completed') return campaign.status === 'completed';
    return true;
  });

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

  const getTotalEarnings = () => {
    return campaigns.reduce((total, campaign) => {
      if (campaign.payment_status === 'completed') return total + campaign.rate;
      if (campaign.payment_status === 'partial') return total + (campaign.rate * 0.5);
      return total;
    }, 0);
  };

  const getActiveCampaigns = () => {
    return campaigns.filter(c => c.status !== 'completed').length;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">My Campaigns</h2>
          <p className="text-sm sm:text-base text-gray-600">Track your active campaigns and deliverables</p>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs sm:text-sm ${filter === 'all' ? 'bg-coral hover:bg-coral/90 text-white' : 'border-gray-200 text-gray-900 hover:bg-coral/5 hover:border-coral/50'}`}
          >
            All ({campaigns.length})
          </Button>
          <Button
            onClick={() => setFilter('active')}
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs sm:text-sm ${filter === 'active' ? 'bg-coral hover:bg-coral/90 text-white' : 'border-gray-200 text-gray-900 hover:bg-coral/5 hover:border-coral/50'}`}
          >
            Active ({getActiveCampaigns()})
          </Button>
          <Button
            onClick={() => setFilter('completed')}
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            className={`text-xs sm:text-sm ${filter === 'completed' ? 'bg-coral hover:bg-coral/90 text-white' : 'border-gray-200 text-gray-900 hover:bg-coral/5 hover:border-coral/50'}`}
          >
            Completed ({campaigns.filter(c => c.status === 'completed').length})
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Total Earnings</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">${getTotalEarnings().toLocaleString()}</p>
          <p className="text-green-500 text-xs sm:text-sm mt-1">From {campaigns.length} campaigns</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Active Campaigns</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{getActiveCampaigns()}</p>
          <p className="text-blue-500 text-xs sm:text-sm mt-1">In progress</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-2">Completed</h3>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'completed').length}</p>
          <p className="text-coral text-xs sm:text-sm mt-1">Successfully delivered</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="text-center py-8 sm:py-12">
            <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              {filter === 'all'
                ? 'Start by accepting campaign opportunities to see them here.'
                : `You don't have any ${filter} campaigns at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredCampaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white border-gray-200 hover:border-coral/50 transition-colors shadow-sm hover:shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={campaign.brand_logo} alt={campaign.brand_name} />
                        <AvatarFallback className="bg-coral text-white text-sm">
                          {campaign.brand_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{campaign.campaign_name}</h3>
                        <p className="text-gray-600 text-sm sm:text-base">{campaign.brand_name}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                          <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            ${campaign.rate.toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {formatDeadline(campaign.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getStatusColor(campaign.status)} text-xs sm:text-sm`}>
                        {campaign.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPaymentStatusColor(campaign.payment_status)} text-xs sm:text-sm`}>
                        {campaign.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{campaign.brief}</p>
                  </div>

                  {campaign.status !== 'completed' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">Deliverables Progress</span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {campaign.completed_deliverables}/{campaign.deliverables_count}
                        </span>
                      </div>
                      <Progress value={campaign.progress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-2 sm:pt-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                        {campaign.platform}
                      </Badge>
                      {campaign.next_deliverable_due && campaign.status !== 'completed' && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Next due: {new Date(campaign.next_deliverable_due).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <Link to={`/creator-campaigns/${campaign.id}`} className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto border-coral text-coral hover:bg-coral/10 text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCampaigns;
