import { useState } from 'react';
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
  deliverables: '10 posts, 5 reels, 20 stories across platforms'
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
  
  const [campaign] = useState<Campaign>(mockCampaign);
  const [influencers, setInfluencers] = useState<CampaignInfluencer[]>(mockInfluencers);
  const [contracts] = useState<Contract[]>(mockContracts);
  const [isCallInProgress, setIsCallInProgress] = useState<Record<string, boolean>>({});
  const [isGmailInProgress, setIsGmailInProgress] = useState<Record<string, boolean>>({});
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [selectedInfluencerForGmail, setSelectedInfluencerForGmail] = useState<CampaignInfluencer | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'paused':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'shortlisted':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'invited':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'declined':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'signed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleOutreach = (influencerId: string) => {
    navigate('/dashboard', { state: { activeTab: 'outreach', influencerId } });
  };

  const handleCreateContract = (influencerId: string) => {
    toast({
      title: "Contract created",
      description: "Contract has been created and sent for signature.",
    });
  };

  const handleAddInfluencer = () => {
    navigate('/dashboard', { state: { activeTab: 'discover' } });
  };

  const handleRemoveInfluencer = (influencerId: string) => {
    setInfluencers(prev => prev.filter(inf => inf.id !== influencerId));
    toast({
      title: "Influencer removed",
      description: "Influencer has been removed from the campaign.",
    });
  };

  const handlePhoneCall = async (influencerId: string, influencerName: string, phoneNumber: number | null) => {
    if (!phoneNumber) {
      toast({
        title: "Phone number not available",
        description: `No phone number found for ${influencerName}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCallInProgress(prev => ({ ...prev, [influencerId]: true }));
      toast({
        title: "Initiating call",
        description: `Starting a call with ${influencerName} at ${phoneNumber}...`,
      });

      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": "sk_97b3adae38c4d320bb4af66a35659213de2e129dc9546f84",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "agent_id": "agent_01jwkpad6te50bmvfd8ax6xvqk",
          "agent_phone_number_id": "phnum_01jwkwbn2terqtgd2nzxedgz0z",
          "to_number": `+${phoneNumber}`
        }),
      });

      const body = await response.json();
      console.log(body);

      if (response.ok) {
        toast({
          title: "Call initiated",
          description: `Connected with ${influencerName}`,
        });
      } else {
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Call failed",
        description: "Unable to initiate the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCallInProgress(prev => ({ ...prev, [influencerId]: false }));
    }
  };

  const handleGmailClick = (influencer: CampaignInfluencer) => {
    if (!influencer.gmail_gmail) {
      toast({
        title: "Gmail not available",
        description: `No Gmail address found for ${influencer.name}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedInfluencerForGmail(influencer);
    setIsGmailModalOpen(true);
  };

  const handleGmailSend = async () => {
    if (!selectedInfluencerForGmail) return;

    try {
      setIsGmailInProgress(prev => ({ ...prev, [selectedInfluencerForGmail.id]: true }));
      
      toast({
        title: "Sending...",
        description: `Sending Gmail workflow for ${selectedInfluencerForGmail.name}...`,
      });

      console.log('Sending Gmail workflow for influencer:', selectedInfluencerForGmail.name);

      const requestBody = {
        gmail: selectedInfluencerForGmail.gmail_gmail,
        campaign: campaign,
        creator: selectedInfluencerForGmail
      };

      console.log('Request body:', requestBody);

      const response = await fetch("https://varhhh.app.n8n.cloud/webhook-test/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: "no-cors", // Add this to handle CORS
        body: JSON.stringify(requestBody),
      });

      // Since we're using no-cors, we won't get a proper response status
      // We'll assume success and show a positive message
      setGmailResponses(prev => ({ ...prev, [selectedInfluencerForGmail.id]: { status: 'sent', timestamp: new Date().toISOString() } }));
      
      toast({
        title: "Request Sent",
        description: `Gmail workflow request sent for ${selectedInfluencerForGmail.name}. Please check your webhook logs to confirm it was received.`,
      });
      setIsGmailModalOpen(false);
      setSelectedInfluencerForGmail(null);

    } catch (error) {
      console.error('Error sending Gmail workflow:', error);
      toast({
        title: "Workflow Failed",
        description: "Unable to send Gmail workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGmailInProgress(prev => ({ ...prev, [selectedInfluencerForGmail.id]: false }));
    }
  };

  const budgetProgress = (campaign.spent / campaign.budget) * 100;

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

      {/* Gmail Confirmation Modal */}
      <Dialog open={isGmailModalOpen} onOpenChange={setIsGmailModalOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-snow">
          <DialogHeader>
            <DialogTitle>Send Gmail Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-snow/70">
              Send Gmail workflow for {selectedInfluencerForGmail?.name} for campaign "{campaign.name}"?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsGmailModalOpen(false)}
                className="border-zinc-700 text-snow hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGmailSend}
                disabled={isGmailInProgress[selectedInfluencerForGmail?.id || '']}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                {isGmailInProgress[selectedInfluencerForGmail?.id || ''] ? 'Sending...' : 'Send Gmail'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="influencers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Influencers
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-snow">Campaign Influencers</h2>
              <Button 
                onClick={handleAddInfluencer}
                className="bg-coral hover:bg-coral/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Influencer
              </Button>
            </div>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-snow/80">Influencer</TableHead>
                      <TableHead className="text-snow/80">Handle</TableHead>
                      <TableHead className="text-snow/80">Followers</TableHead>
                      <TableHead className="text-snow/80">Engagement</TableHead>
                      <TableHead className="text-snow/80">Fee</TableHead>
                      <TableHead className="text-snow/80">Status</TableHead>
                      <TableHead className="text-snow/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {influencers.map((influencer) => (
                      <TableRow key={influencer.id} className="border-zinc-700 hover:bg-zinc-700/50">
                        <TableCell className="font-medium text-snow">{influencer.name}</TableCell>
                        <TableCell className="text-snow/80">{influencer.handle}</TableCell>
                        <TableCell className="text-snow/80">{influencer.followers_count.toLocaleString()}</TableCell>
                        <TableCell className="text-snow/80">{influencer.engagement_rate}%</TableCell>
                        <TableCell className="text-snow/80">${influencer.fee.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(influencer.status)}>
                            {influencer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {influencer.status === 'shortlisted' && (
                              <Button
                                onClick={() => handleOutreach(influencer.id)}
                                variant="ghost"
                                size="sm"
                                className="text-snow/70 hover:text-coral"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Outreach
                              </Button>
                            )}
                            {influencer.status === 'confirmed' && (
                              <Button
                                onClick={() => handleCreateContract(influencer.id)}
                                variant="ghost"
                                size="sm"
                                className="text-snow/70 hover:text-coral"
                              >
                                Create Contract
                              </Button>
                            )}
                            <Button
                              onClick={() => handlePhoneCall(influencer.id, influencer.name, influencer.phone_no)}
                              disabled={isCallInProgress[influencer.id] || !influencer.phone_no}
                              variant="ghost"
                              size="sm"
                              className={`${
                                isCallInProgress[influencer.id]
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : !influencer.phone_no
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-snow/70 hover:text-coral'
                              }`}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              {isCallInProgress[influencer.id] ? 'Calling...' : 'Call'}
                            </Button>
                            <Button
                              onClick={() => handleGmailClick(influencer)}
                              disabled={isGmailInProgress[influencer.id] || !influencer.gmail_gmail}
                              variant="ghost"
                              size="sm"
                              className={`${
                                isGmailInProgress[influencer.id]
                                  ? 'bg-coral border-coral text-white'
                                  : !influencer.gmail_gmail
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-snow/70 hover:text-coral'
                              }`}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              {isGmailInProgress[influencer.id] ? 'Sending...' : 'Gmail'}
                            </Button>
                            <Button
                              onClick={() => handleRemoveInfluencer(influencer.id)}
                              variant="ghost"
                              size="sm"
                              className="text-snow/70 hover:text-red-500"
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gmail Response Display */}
            {Object.keys(gmailResponses).length > 0 && (
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Gmail Workflow Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(gmailResponses).map(([influencerId, response]) => {
                    const influencer = influencers.find(inf => inf.id === influencerId);
                    return (
                      <div key={influencerId} className="bg-green-500/10 border border-green-500/30 rounded-md p-3 mb-3">
                        <p className="text-green-500 text-sm font-medium mb-2">
                          {influencer?.name} - Workflow Response (200 OK):
                        </p>
                        <pre className="text-xs text-green-400 overflow-auto max-h-20">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <h2 className="text-2xl font-semibold text-snow">Campaign Contracts</h2>
            
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-snow/80">Influencer</TableHead>
                      <TableHead className="text-snow/80">Amount</TableHead>
                      <TableHead className="text-snow/80">Deliverables</TableHead>
                      <TableHead className="text-snow/80">Status</TableHead>
                      <TableHead className="text-snow/80">Signed Date</TableHead>
                      <TableHead className="text-snow/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => {
                      const influencer = influencers.find(inf => inf.id === contract.influencerId);
                      return (
                        <TableRow key={contract.id} className="border-zinc-700 hover:bg-zinc-700/50">
                          <TableCell className="font-medium text-snow">{influencer?.name}</TableCell>
                          <TableCell className="text-snow/80">${contract.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {contract.deliverables.slice(0, 2).map((deliverable, index) => (
                                <Badge key={index} variant="outline" className="border-zinc-600 text-snow/70 text-xs">
                                  {deliverable}
                                </Badge>
                              ))}
                              {contract.deliverables.length > 2 && (
                                <Badge variant="outline" className="border-zinc-600 text-snow/70 text-xs">
                                  +{contract.deliverables.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-snow/80">{contract.signedDate || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-snow/70 hover:text-coral"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <h2 className="text-2xl font-semibold text-snow">Performance Metrics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockPerformanceMetrics.map((metric, index) => (
                <Card key={index} className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-snow/80">{metric.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-snow">{metric.value}</div>
                    <p className={`text-xs mt-1 ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 
                      'text-neutral-400'
                    }`}>
                      {metric.change} vs last period
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-snow">Campaign Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-snow/80">
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <ul className="space-y-1 text-sm text-snow/60">
                      <li>• Campaign reach exceeded initial targets by 25%</li>
                      <li>• Engagement rate is performing above industry average</li>
                      <li>• Cost per engagement is within budget expectations</li>
                      <li>• Sarah Johnson's content is driving the highest engagement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CampaignDetail;
