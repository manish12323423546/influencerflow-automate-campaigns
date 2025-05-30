
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Users, TrendingUp, DollarSign, Target, Bell, Settings, LogOut, Activity, AlertTriangle, Clock, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: 'active' | 'completed' | 'draft' | 'paused';
  budget: number;
  spent: number;
  influencer_count: number;
  reach: number;
  engagement_rate: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'influencers'>('campaigns');

  // Fetch user's campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  // Fetch aggregated KPI data
  const { data: kpiData } = useQuery({
    queryKey: ['kpi-data'],
    queryFn: async () => {
      // Mock KPI data - in a real app, this would come from aggregation queries
      return {
        avgCPE: 18.45,
        avgCPEChange: 2.3,
        topPostCTR: 4.8,
        topPostCTRChange: -0.5,
        influencerRetention: 87.2,
        influencerRetentionChange: 5.1,
        milestonesMissed: 3,
        milestonesMissedChange: -2,
        outstandingPayouts: 12450,
        outstandingPayoutsChange: 1200,
        flaggedPosts: 7,
        flaggedPostsChange: -3,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const formatDelta = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-space font-bold text-snow">
                Influencer<span className="text-purple-500">Flow</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-snow/70 hover:text-purple-500 cursor-pointer" />
              <Settings className="h-6 w-6 text-snow/70 hover:text-purple-500 cursor-pointer" />
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-snow">Welcome back!</p>
                  <p className="text-xs text-snow/60">{user.email}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-snow/70 hover:text-purple-500 hover:border-purple-500"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced KPI Cards - 6 new tiles in responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{campaigns.length}</div>
              <p className="text-xs text-neutral-400">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Avg CPE</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${kpiData?.avgCPE?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.avgCPEChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Top Post CTR</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData?.topPostCTR?.toFixed(1) || '0.0'}%</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.topPostCTRChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Influencer Retention</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData?.influencerRetention?.toFixed(1) || '0.0'}%</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.influencerRetentionChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Milestones Missed</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData?.milestonesMissed || 0}</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.milestonesMissedChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Outstanding Payouts</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">${(kpiData?.outstandingPayouts || 0).toLocaleString()}</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.outstandingPayoutsChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Flagged Posts</CardTitle>
              <Flag className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{kpiData?.flaggedPosts || 0}</div>
              <p className="text-xs text-neutral-400">{formatDelta(kpiData?.flaggedPostsChange || 0)} vs prev month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Reach</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">5.7M</div>
              <p className="text-xs text-neutral-400">+12% vs prev month</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex space-x-1 bg-zinc-900 p-1 rounded-lg">
            <Button
              variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('campaigns')}
              className={activeTab === 'campaigns' ? 'bg-purple-500 text-white' : 'text-snow/70 hover:text-snow'}
            >
              Campaigns
            </Button>
            <Button
              variant={activeTab === 'influencers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab('influencers');
                navigate('/influencers');
              }}
              className={activeTab === 'influencers' ? 'bg-purple-500 text-white' : 'text-snow/70 hover:text-snow'}
            >
              Influencers
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10 w-64"
              />
            </div>
            <Button className="btn-purple">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        {/* Campaigns Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-snow/80">Campaign</TableHead>
                  <TableHead className="text-snow/80">Brand</TableHead>
                  <TableHead className="text-snow/80">Status</TableHead>
                  <TableHead className="text-snow/80">Budget</TableHead>
                  <TableHead className="text-snow/80">Spent</TableHead>
                  <TableHead className="text-snow/80">Influencers</TableHead>
                  <TableHead className="text-snow/80">Reach</TableHead>
                  <TableHead className="text-snow/80">Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-snow">{campaign.name}</TableCell>
                    <TableCell className="text-snow/80">{campaign.brand}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-snow/80">${campaign.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">${campaign.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">{campaign.influencer_count}</TableCell>
                    <TableCell className="text-snow/80">{campaign.reach.toLocaleString()}</TableCell>
                    <TableCell className="text-snow/80">{campaign.engagement_rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
