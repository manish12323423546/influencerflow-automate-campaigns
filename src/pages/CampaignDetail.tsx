
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Users, FileText, BarChart } from 'lucide-react';
import { ContractManager } from '@/components/contracts/ContractManager';
import { PerformanceTracker } from '@/components/performance/PerformanceTracker';

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
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CampaignInfluencer {
  id: string;
  status: string;
  fee: number;
  influencer: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    platform: string;
    industry: string;
    followers_count: number;
    engagement_rate: number;
  };
}

// Mock campaign data
const mockCampaign: Campaign = {
  id: '1',
  name: 'Tech Product Launch',
  description: 'An exciting campaign to launch our latest tech product to the market.',
  goals: 'Increase brand awareness, drive website traffic, and generate 1000+ leads',
  target_audience: 'Tech enthusiasts, early adopters, professionals aged 25-45',
  budget: 50000,
  deliverables: '5 Instagram posts, 3 TikTok videos, 2 YouTube reviews, 10 Instagram stories',
  timeline: '6 weeks (January 15 - February 28, 2024)',
  status: 'active',
  brand: 'TechCorp',
  user_id: 'mock-user-123',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z'
};

// Mock campaign influencers
const mockCampaignInfluencers: CampaignInfluencer[] = [
  {
    id: '1',
    status: 'confirmed',
    fee: 5000,
    influencer: {
      id: '1',
      name: 'Tech Reviewer Pro',
      handle: '@techreviewerpro',
      avatar_url: '/placeholder.svg',
      platform: 'youtube',
      industry: 'Technology',
      followers_count: 250000,
      engagement_rate: 6.8
    }
  },
  {
    id: '2',
    status: 'shortlisted',
    fee: 3500,
    influencer: {
      id: '2',
      name: 'Gadget Guru',
      handle: '@gadgetguru',
      avatar_url: '/placeholder.svg',
      platform: 'instagram',
      industry: 'Technology',
      followers_count: 150000,
      engagement_rate: 4.2
    }
  }
];

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignInfluencers, setCampaignInfluencers] = useState<CampaignInfluencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCampaign(mockCampaign);
      setCampaignInfluencers(mockCampaignInfluencers);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      case 'shortlisted':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'confirmed':
        return 'bg-green-500/10 text-green-500';
      case 'rejected':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

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
              <Link 
                to="/campaigns" 
                className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Campaigns
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-snow">{campaign.name}</h1>
                <p className="text-sm text-snow/60">Campaign Details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={getStatusBadgeColor(campaign.status)}>
                {campaign.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/campaigns/${id}/edit`)}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-zinc-900 border-zinc-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="influencers" className="data-[state=active]:bg-purple-500">
                  <Users className="h-4 w-4 mr-2" />
                  Influencers ({campaignInfluencers.length})
                </TabsTrigger>
                <TabsTrigger value="contracts" className="data-[state=active]:bg-purple-500">
                  <FileText className="h-4 w-4 mr-2" />
                  Contracts
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-purple-500">
                  <BarChart className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-snow">Campaign Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.description && (
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Description</h4>
                        <p className="text-snow/80">{campaign.description}</p>
                      </div>
                    )}
                    
                    {campaign.goals && (
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Goals</h4>
                        <p className="text-snow/80">{campaign.goals}</p>
                      </div>
                    )}
                    
                    {campaign.target_audience && (
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Target Audience</h4>
                        <p className="text-snow/80">{campaign.target_audience}</p>
                      </div>
                    )}
                    
                    {campaign.deliverables && (
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Deliverables</h4>
                        <p className="text-snow/80">{campaign.deliverables}</p>
                      </div>
                    )}

                    {campaign.brand && (
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Brand</h4>
                        <p className="text-snow/80">{campaign.brand}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="influencers">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-snow flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Selected Influencers ({campaignInfluencers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaignInfluencers.length === 0 ? (
                      <div className="text-center py-8 text-snow/60">
                        <p className="mb-4">No influencers added to this campaign yet.</p>
                        <Button
                          onClick={() => navigate('/influencers')}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          Browse Influencers
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {campaignInfluencers.map((campaignInfluencer) => (
                          <div
                            key={campaignInfluencer.id}
                            className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage 
                                  src={campaignInfluencer.influencer.avatar_url || ''} 
                                  alt={campaignInfluencer.influencer.name} 
                                />
                                <AvatarFallback className="bg-purple-500 text-white">
                                  {campaignInfluencer.influencer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <p className="font-medium text-snow">
                                  {campaignInfluencer.influencer.name}
                                </p>
                                <p className="text-sm text-snow/60">
                                  {campaignInfluencer.influencer.handle}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                                    {campaignInfluencer.influencer.industry}
                                  </Badge>
                                  <Badge variant="outline" className="border-purple-500/30 text-purple-500 text-xs">
                                    {campaignInfluencer.influencer.platform}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <Badge className={getStatusBadgeColor(campaignInfluencer.status)}>
                                {campaignInfluencer.status}
                              </Badge>
                              <div className="text-sm text-snow/70 mt-1">
                                {formatFollowers(campaignInfluencer.influencer.followers_count)} followers
                              </div>
                              {campaignInfluencer.fee > 0 && (
                                <div className="text-sm text-snow/70">
                                  Fee: ${campaignInfluencer.fee.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts">
                <ContractManager 
                  campaignId={campaign.id} 
                  campaignInfluencers={campaignInfluencers}
                />
              </TabsContent>

              <TabsContent value="performance">
                <PerformanceTracker 
                  campaignId={campaign.id} 
                  campaignInfluencers={campaignInfluencers}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Campaign Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-snow/60">Budget</p>
                  <p className="text-lg font-semibold text-snow">
                    ${campaign.budget.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-snow/60">Timeline</p>
                  <p className="text-snow">{campaign.timeline || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-snow/60">Created</p>
                  <p className="text-snow">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-snow/60">Total Influencers</p>
                  <p className="text-lg font-semibold text-snow">
                    {campaignInfluencers.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
