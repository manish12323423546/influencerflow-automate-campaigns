import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, TrendingUp, DollarSign, Target, Bell, Activity, Settings, Plus,
  BarChart3, MessageSquare, FileText, CreditCard, Search, Headphones
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CampaignsManager from '@/components/dashboard/CampaignsManager';
import DiscoverCreators from '@/components/dashboard/DiscoverCreators';
import OutreachesManager from '@/components/dashboard/OutreachesManager';
import ContractsManager from '@/components/dashboard/ContractsManager';
import PaymentsManager from '@/components/dashboard/PaymentsManager';
import ConversationsManager from '@/components/dashboard/ConversationsManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Campaign } from '@/types/campaign';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'discover' | 'outreach' | 'contracts' | 'payments' | 'conversations'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch campaigns from Supabase
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast({
          title: "Error loading campaigns",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast]);

  // Calculate KPI data from campaigns
  const kpiData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    avgCPE: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.spent / (c.reach || 1) * 1000), 0) / campaigns.length : 0,
    avgCPEChange: 2.3,
    topPostCTR: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.engagement_rate, 0) / campaigns.length : 0,
    topPostCTRChange: -0.5,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0) / 1000000, // Convert to millions
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const navigationItems = [
    { id: 'campaigns', label: 'Campaigns', icon: Target, description: 'Manage your campaigns' },
    { id: 'discover', label: 'Discover Creators', icon: Users, description: 'Find perfect influencers' },
    { id: 'outreach', label: 'Outreaches', icon: MessageSquare, description: 'Chat with creators' },
    { id: 'contracts', label: 'Contracts', icon: FileText, description: 'Manage contracts' },
    { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Handle payments' },
    { id: 'conversations', label: 'Conversations', icon: Headphones, description: 'Manage AI conversations' },
  ];

  return (
    <div className="min-h-screen bg-carbon text-snow">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-space font-bold text-snow hover:text-coral transition-colors">
                Influencer<span className="text-coral">Flow</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-snow/70 hover:text-coral cursor-pointer transition-colors" />
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-snow/70 hover:text-coral">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/creator-dashboard">
                <Button className="bg-coral hover:bg-coral/90 text-white">
                  <Users className="mr-2 h-4 w-4" />
                  Switch to Creator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards at the top */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData.totalCampaigns}</div>
              <p className="text-xs text-neutral-400">Active: {kpiData.activeCampaigns}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Avg CPE</CardTitle>
              <DollarSign className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${kpiData.avgCPE.toFixed(2)}</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData.avgCPEChange)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Avg Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData.topPostCTR.toFixed(1)}%</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData.topPostCTRChange)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${kpiData.totalBudget.toLocaleString()}</div>
              <p className="text-xs text-neutral-400">Across all campaigns</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Spent</CardTitle>
              <Activity className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${kpiData.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-neutral-400">Campaign expenses</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Reach</CardTitle>
              <TrendingUp className="h-4 w-4 text-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData.totalReach.toFixed(1)}M</div>
              <p className="text-xs text-neutral-400">People reached</p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Back Text */}
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold text-snow mb-2">
            Welcome Back!
          </h1>
          <p className="text-xl text-snow/80">
            Manage your campaigns, discover creators, and track performance
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                variant={activeTab === item.id ? 'default' : 'outline'}
                className={activeTab === item.id 
                  ? 'bg-coral hover:bg-coral/90 text-white' 
                  : 'border-zinc-700 text-snow hover:bg-zinc-800'
                }
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
          
          <Button
            onClick={handleCreateCampaign}
            className="bg-coral hover:bg-coral/90 text-white ml-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </div>

        {/* Content based on active tab */}
        <div className="space-y-6">
          {activeTab === 'campaigns' && <CampaignsManager campaigns={campaigns} />}
          {activeTab === 'discover' && <DiscoverCreators />}
          {activeTab === 'outreach' && <OutreachesManager />}
          {activeTab === 'contracts' && <ContractsManager />}
          {activeTab === 'payments' && <PaymentsManager />}
          {activeTab === 'conversations' && <ConversationsManager />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
