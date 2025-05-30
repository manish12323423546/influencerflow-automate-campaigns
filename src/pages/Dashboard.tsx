
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Users, TrendingUp, DollarSign, Target, Bell, Settings, LogOut } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: 'Active' | 'Completed' | 'Draft' | 'Paused';
  budget: number;
  spent: number;
  influencers: number;
  reach: number;
  engagement: string;
}

interface Influencer {
  id: string;
  name: string;
  platform: string;
  followers: string;
  engagement: string;
  category: string;
  status: 'Available' | 'Booked' | 'Under Review';
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'campaigns' | 'influencers'>('campaigns');

  // Mock data - in a real app this would come from your API
  const [campaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Fashion Campaign',
      brand: 'StyleCo',
      status: 'Active',
      budget: 50000,
      spent: 32000,
      influencers: 8,
      reach: 2500000,
      engagement: '4.2%'
    },
    {
      id: '2',
      name: 'Tech Product Launch',
      brand: 'TechFlow',
      status: 'Completed',
      budget: 75000,
      spent: 73500,
      influencers: 12,
      reach: 3200000,
      engagement: '5.8%'
    },
    {
      id: '3',
      name: 'Fitness Challenge',
      brand: 'FitLife',
      status: 'Draft',
      budget: 30000,
      spent: 0,
      influencers: 0,
      reach: 0,
      engagement: '0%'
    }
  ]);

  const [influencers] = useState<Influencer[]>([
    {
      id: '1',
      name: 'Emma Rodriguez',
      platform: 'Instagram',
      followers: '125K',
      engagement: '6.2%',
      category: 'Fashion',
      status: 'Available'
    },
    {
      id: '2',
      name: 'Jake Thompson',
      platform: 'YouTube',
      followers: '890K',
      engagement: '4.8%',
      category: 'Tech',
      status: 'Booked'
    },
    {
      id: '3',
      name: 'Sarah Kim',
      platform: 'TikTok',
      followers: '2.1M',
      engagement: '8.5%',
      category: 'Lifestyle',
      status: 'Under Review'
    }
  ]);

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

  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Available':
        return 'text-green-500 bg-green-500/10';
      case 'Completed':
      case 'Booked':
        return 'text-blue-500 bg-blue-500/10';
      case 'Draft':
      case 'Under Review':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'Paused':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
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
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{campaigns.length}</div>
              <p className="text-xs text-snow/60">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Active Influencers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">{influencers.length}</div>
              <p className="text-xs text-snow/60">+5 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Total Reach</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">5.7M</div>
              <p className="text-xs text-snow/60">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-snow/80">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-snow">$125K</div>
              <p className="text-xs text-snow/60">+8% from last month</p>
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
              onClick={() => setActiveTab('influencers')}
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

        {/* Data Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-0">
            {activeTab === 'campaigns' ? (
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
                      <TableCell className="text-snow/80">{campaign.influencers}</TableCell>
                      <TableCell className="text-snow/80">{campaign.reach.toLocaleString()}</TableCell>
                      <TableCell className="text-snow/80">{campaign.engagement}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-snow/80">Name</TableHead>
                    <TableHead className="text-snow/80">Platform</TableHead>
                    <TableHead className="text-snow/80">Followers</TableHead>
                    <TableHead className="text-snow/80">Engagement</TableHead>
                    <TableHead className="text-snow/80">Category</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfluencers.map((influencer) => (
                    <TableRow key={influencer.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-snow">{influencer.name}</TableCell>
                      <TableCell className="text-snow/80">{influencer.platform}</TableCell>
                      <TableCell className="text-snow/80">{influencer.followers}</TableCell>
                      <TableCell className="text-snow/80">{influencer.engagement}</TableCell>
                      <TableCell className="text-snow/80">{influencer.category}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(influencer.status)}`}>
                          {influencer.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
