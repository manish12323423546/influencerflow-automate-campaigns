import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Users, BarChart3, FileText, MessageSquare, Plus, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Campaign {
  id: string;
  name: string;
  description: string;
  brand: string;
  status: 'active' | 'completed' | 'draft' | 'paused';
  budget: number;
  spent: number;
  reach: number;
  engagement_rate: number;
  start_date: string;
  end_date: string;
  goals: string;
  target_audience: string;
  deliverables: string;
  campaign_influencers?: Array<{
    id: string;
    fee: number;
    status: string;
    match_score: number;
    match_reason: string;
    influencer: {
      id: string;
      handle: string;
      name: string;
      avatar_url: string;
      platform: string;
      followers_count: number;
      engagement_rate: number;
    };
  }>;
}

interface CampaignInfluencer {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  status: 'shortlisted' | 'invited' | 'confirmed' | 'declined' | 'completed';
  followers_count: number;
  engagement_rate: number;
  fee: number;
  phone_no?: number | null;
  gmail_gmail?: string | null;
}

interface Contract {
  id: string;
  influencerId: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  amount: number;
  deliverables: string[];
  signedDate?: string;
}

interface PerformanceMetric {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

// Mock data - updated to include phone and gmail
const mockCampaign: Campaign = {
  id: '1',
  name: 'Tech Product Launch',
  description: 'Launch campaign for our new tech product targeting tech enthusiasts',
  brand: 'TechCorp',
  status: 'active',
  budget: 15000,
  spent: 8500,
  reach: 250000,
  engagement_rate: 4.2,
  start_date: '2024-01-15',
  end_date: '2024-02-15',
  goals: 'Increase brand awareness and drive product sales',
  target_audience: 'Tech enthusiasts aged 25-40',
  deliverables: '10 posts, 5 reels, 20 stories across platforms',
  campaign_influencers: [
    {
      id: '1',
      fee: 2500,
      status: 'confirmed',
      match_score: 95,
      match_reason: 'High match score',
      influencer: {
        id: '1',
        handle: '@sarahj_tech',
        name: 'Sarah Johnson',
        avatar_url: '/placeholder.svg',
        platform: 'Instagram',
        followers_count: 125000,
        engagement_rate: 4.8
      }
    },
    {
      id: '2',
      fee: 1800,
      status: 'shortlisted',
      match_score: 85,
      match_reason: 'High potential',
      influencer: {
        id: '2',
        handle: '@mikefitness',
        name: 'Mike Chen',
        avatar_url: '/placeholder.svg',
        platform: 'Instagram',
        followers_count: 89000,
        engagement_rate: 6.2
      }
    },
    {
      id: '3',
      fee: 2200,
      status: 'invited',
      match_score: 75,
      match_reason: 'Low engagement',
      influencer: {
        id: '3',
        handle: '@emmastyle',
        name: 'Emma Style',
        avatar_url: '/placeholder.svg',
        platform: 'Instagram',
        followers_count: 95000,
        engagement_rate: 5.5
      }
    }
  ]
};

const mockInfluencers: CampaignInfluencer[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahj_tech',
    avatar_url: '/placeholder.svg',
    status: 'confirmed',
    followers_count: 125000,
    engagement_rate: 4.8,
    fee: 2500,
    phone_no: 1234567890,
    gmail_gmail: 'sarah@gmail.com'
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@mikefitness',
    avatar_url: '/placeholder.svg',
    status: 'shortlisted',
    followers_count: 89000,
    engagement_rate: 6.2,
    fee: 1800,
    phone_no: 9876543210,
    gmail_gmail: 'mike@gmail.com'
  },
  {
    id: '3',
    name: 'Emma Style',
    handle: '@emmastyle',
    avatar_url: '/placeholder.svg',
    status: 'invited',
    followers_count: 95000,
    engagement_rate: 5.5,
    fee: 2200,
    phone_no: null,
    gmail_gmail: 'emma@gmail.com'
  }
];

const mockContracts: Contract[] = [
  {
    id: '1',
    influencerId: '1',
    status: 'signed',
    amount: 2500,
    deliverables: ['3 Instagram Posts', '1 Reel', '5 Stories'],
    signedDate: '2024-01-20'
  }
];

const mockPerformanceMetrics: PerformanceMetric[] = [
  { metric: 'Total Reach', value: '250K', change: '+12%', trend: 'up' },
  { metric: 'Engagement Rate', value: '4.2%', change: '+0.8%', trend: 'up' },
  { metric: 'Click-through Rate', value: '2.1%', change: '-0.3%', trend: 'down' },
  { metric: 'Cost per Engagement', value: '$1.25', change: '+5%', trend: 'down' }
];

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
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
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Campaign not found",
            description: "The requested campaign could not be found.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setCampaign(data);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        toast({
          title: "Error loading campaign",
          description: "There was a problem loading the campaign details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id, navigate, toast]);

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

  const budgetProgress = campaign ? (campaign.spent / campaign.budget) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-snow">Loading campaign details...</div>
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
                onClick={() => navigate('/dashboard')}
                className="text-snow/70 hover:text-coral"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-snow">{campaign.name}</h1>
                <p className="text-sm text-snow/60">{campaign.brand}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status}
              </Badge>
              <Button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-snow hover:bg-zinc-800"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-zinc-800/50 border-zinc-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500">Overview</TabsTrigger>
            <TabsTrigger value="influencers" className="data-[state=active]:bg-purple-500">Influencers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Campaign Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-snow/80 mb-1">Description</h4>
                    <p className="text-snow/60">{campaign.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-snow/80 mb-1">Goals</h4>
                    <p className="text-snow/60">{campaign.goals}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-snow/80 mb-1">Target Audience</h4>
                    <p className="text-snow/60">{campaign.target_audience}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-snow/80 mb-1">Deliverables</h4>
                    <p className="text-snow/60">{campaign.deliverables}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-snow/80 mb-1">Start Date</h4>
                      <p className="text-snow/60">{campaign.start_date}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-snow/80 mb-1">End Date</h4>
                      <p className="text-snow/60">{campaign.end_date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Budget & Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-snow/80">Budget Used</span>
                      <span className="text-snow">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</span>
                    </div>
                    <Progress value={budgetProgress} className="h-2" />
                    <p className="text-xs text-snow/60">{budgetProgress.toFixed(1)}% of budget used</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-zinc-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-snow">{campaign.reach.toLocaleString()}</p>
                      <p className="text-sm text-snow/60">Total Reach</p>
                    </div>
                    <div className="text-center p-3 bg-zinc-700/50 rounded-lg">
                      <p className="text-2xl font-bold text-snow">{campaign.engagement_rate}%</p>
                      <p className="text-sm text-snow/60">Engagement Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="influencers" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-snow">Campaign Influencers</CardTitle>
                  <Button variant="outline" size="sm" className="border-zinc-700 text-snow hover:bg-zinc-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Influencer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-snow/80">Influencer</TableHead>
                      <TableHead className="text-snow/80">Platform</TableHead>
                      <TableHead className="text-snow/80">Followers</TableHead>
                      <TableHead className="text-snow/80">Engagement</TableHead>
                      <TableHead className="text-snow/80">Fee</TableHead>
                      <TableHead className="text-snow/80">Status</TableHead>
                      <TableHead className="text-snow/80">Match Score</TableHead>
                      <TableHead className="text-snow/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.campaign_influencers?.map((ci) => (
                      <TableRow key={ci.id} className="border-zinc-700">
                        <TableCell className="font-medium text-snow">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {ci.influencer.avatar_url ? (
                                <img
                                  src={ci.influencer.avatar_url}
                                  alt={ci.influencer.name}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                  <span className="text-snow text-sm">{ci.influencer.name[0]}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-snow">{ci.influencer.name}</div>
                              <div className="text-sm text-snow/60">@{ci.influencer.handle}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-snow/80">{ci.influencer.platform}</TableCell>
                        <TableCell className="text-snow/80">{ci.influencer.followers_count.toLocaleString()}</TableCell>
                        <TableCell className="text-snow/80">{ci.influencer.engagement_rate}%</TableCell>
                        <TableCell className="text-snow/80">${ci.fee.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ci.status)}>{ci.status}</Badge>
                        </TableCell>
                        <TableCell className="text-snow/80">{ci.match_score}%</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-snow/70 hover:text-coral">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CampaignDetail;
