
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, DollarSign, FileText, CheckCircle, Clock, Upload, MessageSquare } from 'lucide-react';

interface CreatorCampaign {
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
  deliverables: Array<{
    id: string;
    name: string;
    description: string;
    deadline: string;
    status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'pending_review';
    type: 'post' | 'reel' | 'story' | 'video';
  }>;
  platform: string;
  location?: string;
  contract_signed: boolean;
  payment_status: 'pending' | 'partial' | 'completed';
}

// Mock data for creator campaign
const mockCreatorCampaign: CreatorCampaign = {
  id: '1',
  campaign_id: '1',
  brand_name: 'TechCorp',
  campaign_name: 'Tech Product Launch',
  brief: 'We are launching our revolutionary new smartphone and need authentic creators to showcase its features. Looking for creative content that highlights the camera quality, battery life, and sleek design. Please focus on real-world usage scenarios.',
  rate: 2500,
  deadline: '2024-02-15',
  status: 'in_progress',
  created_at: '2024-01-20T10:00:00Z',
  brand_logo: '/placeholder.svg',
  deliverables: [
    {
      id: '1',
      name: 'Unboxing Post',
      description: 'Create an Instagram post showing the unboxing experience',
      deadline: '2024-02-01',
      status: 'completed',
      type: 'post'
    },
    {
      id: '2',
      name: 'Feature Showcase Reel',
      description: 'Create a 30-second reel highlighting key features',
      deadline: '2024-02-05',
      status: 'in_progress',
      type: 'reel'
    },
    {
      id: '3',
      name: 'Daily Usage Stories',
      description: 'Share 5 Instagram stories showing daily usage',
      deadline: '2024-02-10',
      status: 'pending',
      type: 'story'
    }
  ],
  platform: 'Instagram',
  location: 'Remote',
  contract_signed: true,
  payment_status: 'partial'
};

const CreatorCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<CreatorCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading campaign data
    setTimeout(() => {
      setCampaign(mockCreatorCampaign);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500/10 text-green-500';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'pending_review':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getDeliverableProgress = () => {
    if (!campaign) return 0;
    const completed = campaign.deliverables.filter(d => d.status === 'completed' || d.status === 'approved').length;
    return (completed / campaign.deliverables.length) * 100;
  };

  const handleDeliverableAction = (deliverableId: string, action: string) => {
    if (!campaign) return;
    
    setCampaign(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        deliverables: prev.deliverables.map(d => {
          if (d.id === deliverableId) {
            if (action === 'start') {
              return { ...d, status: 'in_progress' };
            } else if (action === 'submit') {
              return { ...d, status: 'pending_review' };
            }
          }
          return d;
        })
      };
    });

    toast({
      title: action === 'start' ? 'Deliverable started' : 'Deliverable submitted',
      description: action === 'start' ? 'You can now work on this deliverable.' : 'Your deliverable has been submitted for review.',
    });
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
                to="/creator-dashboard" 
                className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-snow">{campaign.campaign_name}</h1>
                <p className="text-sm text-snow/60">Campaign Details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.replace('_', ' ')}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-snow/60">Total Payment</p>
                <p className="text-lg font-semibold text-snow">${campaign.rate.toLocaleString()}</p>
              </div>
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
                <TabsTrigger value="deliverables" className="data-[state=active]:bg-purple-500">
                  <FileText className="h-4 w-4 mr-2" />
                  Deliverables ({campaign.deliverables.length})
                </TabsTrigger>
                <TabsTrigger value="communications" className="data-[state=active]:bg-purple-500">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Communications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Progress Card */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-snow">Campaign Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-snow/70">Overall Progress</span>
                          <span className="text-snow font-medium">{Math.round(getDeliverableProgress())}%</span>
                        </div>
                        <Progress value={getDeliverableProgress()} className="h-2" />
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-snow">
                              {campaign.deliverables.filter(d => d.status === 'completed' || d.status === 'approved').length}
                            </p>
                            <p className="text-snow/60 text-sm">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-snow">
                              {campaign.deliverables.filter(d => d.status === 'in_progress').length}
                            </p>
                            <p className="text-snow/60 text-sm">In Progress</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-snow">
                              {campaign.deliverables.filter(d => d.status === 'pending').length}
                            </p>
                            <p className="text-snow/60 text-sm">Pending</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Campaign Details */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-snow">Campaign Brief</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-snow mb-2">Description</h4>
                        <p className="text-snow/80">{campaign.brief}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-snow mb-2">Platform</h4>
                          <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                            {campaign.platform}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-snow mb-2">Location</h4>
                          <p className="text-snow/80">{campaign.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="deliverables">
                <div className="space-y-4">
                  {campaign.deliverables.map((deliverable) => (
                    <Card key={deliverable.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-snow">{deliverable.name}</h3>
                              <Badge className={getStatusColor(deliverable.status)}>
                                {deliverable.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                                {deliverable.type}
                              </Badge>
                            </div>
                            <p className="text-snow/70 mb-3">{deliverable.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-snow/60">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {new Date(deliverable.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            {deliverable.status === 'pending' && (
                              <Button
                                onClick={() => handleDeliverableAction(deliverable.id, 'start')}
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                Start Work
                              </Button>
                            )}
                            {deliverable.status === 'in_progress' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-zinc-700 text-snow hover:bg-zinc-800"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload
                                </Button>
                                <Button
                                  onClick={() => handleDeliverableAction(deliverable.id, 'submit')}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  Submit
                                </Button>
                              </>
                            )}
                            {(deliverable.status === 'completed' || deliverable.status === 'approved') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-500 text-green-500 hover:bg-green-500/10"
                                disabled
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="communications">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-snow">Campaign Communications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-snow/60">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-snow/30" />
                      <h3 className="text-lg font-medium text-snow mb-2">No messages yet</h3>
                      <p>Direct communication with the brand will appear here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Brand Info */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-snow">Brand Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={campaign.brand_logo} alt={campaign.brand_name} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {campaign.brand_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-snow">{campaign.brand_name}</p>
                    <p className="text-sm text-snow/60">Brand Partner</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-snow/60">Campaign Fee</p>
                    <p className="text-lg font-semibold text-snow">${campaign.rate.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-snow/60">Final Deadline</p>
                    <p className="text-snow flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(campaign.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-snow/60">Contract Status</p>
                    <Badge className={campaign.contract_signed ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                      {campaign.contract_signed ? 'Signed' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-snow/60">Payment Status</p>
                    <Badge className={getStatusColor(campaign.payment_status)}>
                      {campaign.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCampaignDetail;
