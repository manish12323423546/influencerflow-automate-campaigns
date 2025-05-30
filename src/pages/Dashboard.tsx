
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Plus, Users, TrendingUp, DollarSign, Target, Bell, Activity, Home, ArrowRight, Building,
  BarChart3, Calendar, CreditCard, Receipt, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PaymentOverview from '@/components/payments/PaymentOverview';
import TransactionHistory from '@/components/payments/TransactionHistory';
import MilestoneManager from '@/components/payments/MilestoneManager';
import RazorpayPayment from '@/components/payments/RazorpayPayment';

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

// Mock data without authentication
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Tech Product Launch',
    brand: 'TechCorp',
    status: 'active',
    budget: 15000,
    spent: 12000,
    influencer_count: 5,
    reach: 250000,
    engagement_rate: 4.2
  },
  {
    id: '2',
    name: 'Fashion Summer Collection',
    brand: 'StyleBrand',
    status: 'draft',
    budget: 8000,
    spent: 0,
    influencer_count: 3,
    reach: 0,
    engagement_rate: 0
  },
  {
    id: '3',
    name: 'Fitness App Promotion',
    brand: 'FitLife',
    status: 'completed',
    budget: 12000,
    spent: 11500,
    influencer_count: 2,
    reach: 180000,
    engagement_rate: 5.1
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'payments' | 'transactions' | 'milestones'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [campaigns] = useState<Campaign[]>(mockCampaigns);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Calculate KPI data from campaigns
  const kpiData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    avgCPE: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.spent / (c.reach || 1) * 1000), 0) / campaigns.length : 0,
    avgCPEChange: 2.3,
    topPostCTR: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.engagement_rate, 0) / campaigns.length : 0,
    topPostCTRChange: -0.5,
    influencerRetention: 87.2,
    influencerRetentionChange: 5.1,
    milestonesMissed: 3,
    milestonesMissedChange: -2,
    outstandingPayouts: campaigns.reduce((sum, c) => sum + (c.budget - c.spent), 0),
    outstandingPayoutsChange: 1200,
    flaggedPosts: 7,
    flaggedPostsChange: -3,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
    totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0) / 1000000, // Convert to millions
  };

  // Quick action handlers
  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleDiscoverCreators = () => {
    navigate('/influencers');
  };

  const handleViewCampaigns = () => {
    navigate('/campaigns');
  };

  const handleCampaignPayment = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setPaymentDialogOpen(true);
  };

  // Enhanced filtering logic for campaigns tab
  const filteredCampaigns = campaigns.filter(campaign => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!campaign.name.toLowerCase().includes(searchLower) && 
          !campaign.brand.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'all' && campaign.status !== statusFilter) {
      return false;
    }
    
    // Brand filter
    if (brandFilter !== 'all' && campaign.brand !== brandFilter) {
      return false;
    }
    
    return true;
  });

  // Get unique brands for filter
  const uniqueBrands = [...new Set(campaigns.map(campaign => campaign.brand))];

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-snow">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-space font-bold text-snow">
                Influencer<span className="text-purple-500">Flow</span> • Brand Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-snow/70 hover:text-purple-500 cursor-pointer" />
              
              {/* Navigation buttons to switch dashboards */}
              <Link to="/">
                <Button variant="outline" className="border-zinc-700 text-snow hover:bg-zinc-800">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </Link>
              <Link to="/creator-dashboard">
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Users className="mr-2 h-4 w-4" />
                  Switch to Creator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-space font-bold mb-2">
            Brand Dashboard
          </h1>
          <p className="text-xl text-snow/80">
            Manage your campaigns, track performance, and handle payments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-snow mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={handleCreateCampaign}
                  className="bg-purple-500 hover:bg-purple-600 text-white h-16 text-left justify-start"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Create Campaign</p>
                    <p className="text-sm opacity-80">Start a new campaign</p>
                  </div>
                </Button>
                
                <Button
                  onClick={handleDiscoverCreators}
                  variant="outline"
                  className="border-zinc-700 text-snow hover:bg-zinc-800 h-16 text-left justify-start"
                >
                  <Users className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Discover Creators</p>
                    <p className="text-sm opacity-60">Find perfect influencers</p>
                  </div>
                </Button>
                
                <Button
                  onClick={handleViewCampaigns}
                  variant="outline"
                  className="border-zinc-700 text-snow hover:bg-zinc-800 h-16 text-left justify-start"
                >
                  <Target className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">View All Campaigns</p>
                    <p className="text-sm opacity-60">Manage your campaigns</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => navigate('/brand-profile')}
                  variant="outline"
                  className="border-zinc-700 text-snow hover:bg-zinc-800 h-16 text-left justify-start"
                >
                  <Building className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Brand Profile</p>
                    <p className="text-sm opacity-60">Update your profile</p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Enhanced KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Total Campaigns</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">{kpiData.totalCampaigns}</div>
                  <p className="text-xs text-neutral-400">Active: {kpiData.activeCampaigns}</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Avg CPE</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">${kpiData.avgCPE.toFixed(2)}</div>
                  <p className="text-xs text-neutral-400">{formatDelta(kpiData.avgCPEChange)} vs prev month</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Avg Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">{kpiData.topPostCTR.toFixed(1)}%</div>
                  <p className="text-xs text-neutral-400">{formatDelta(kpiData.topPostCTRChange)} vs prev month</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">${kpiData.totalBudget.toLocaleString()}</div>
                  <p className="text-xs text-neutral-400">Across all campaigns</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Total Spent</CardTitle>
                  <Activity className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">${kpiData.totalSpent.toLocaleString()}</div>
                  <p className="text-xs text-neutral-400">Campaign expenses</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Total Reach</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">{kpiData.totalReach.toFixed(1)}M</div>
                  <p className="text-xs text-neutral-400">People reached</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">3.2x</div>
                  <p className="text-xs text-neutral-400">Return on investment</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-snow/80">Performance</CardTitle>
                  <Activity className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-snow">High</div>
                  <p className="text-xs text-neutral-400">Overall performance</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-snow/80">
                    • New influencer application received
                  </div>
                  <div className="text-sm text-snow/80">
                    • Campaign "Summer Collection" launched
                  </div>
                  <div className="text-sm text-snow/80">
                    • Payment milestone approved
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Campaign ROI</span>
                    <span className="text-green-500">+24%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Content Created</span>
                    <span className="text-snow">89 posts</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-snow/80">Total Spent</span>
                    <span className="text-snow">₹2,45,000</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-snow">Find Influencers</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-snow">Create Campaign</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-zinc-700/50 rounded cursor-pointer">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-snow">Process Payment</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Search, Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10 w-64"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>

                {/* Brand Filter */}
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="all">All Brands</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateCampaign} className="bg-purple-500 hover:bg-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Add New Campaign
              </Button>
            </div>

            {/* Campaigns Table */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="text-snow/80">Campaign</TableHead>
                      <TableHead className="text-snow/80">Brand</TableHead>
                      <TableHead className="text-snow/80">Status</TableHead>
                      <TableHead className="text-snow/80">Budget</TableHead>
                      <TableHead className="text-snow/80">Spent</TableHead>
                      <TableHead className="text-snow/80">Influencers</TableHead>
                      <TableHead className="text-snow/80">Reach</TableHead>
                      <TableHead className="text-snow/80">Engagement</TableHead>
                      <TableHead className="text-snow/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-snow/60">
                          {campaigns.length === 0 
                            ? "No campaigns found. Create your first campaign to get started."
                            : "No campaigns match your current filters. Try adjusting your search criteria."
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCampaigns.map((campaign) => (
                        <TableRow 
                          key={campaign.id} 
                          className="border-zinc-700 hover:bg-zinc-700/50"
                        >
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
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                variant="ghost"
                                size="sm"
                                className="text-snow/70 hover:text-purple-500"
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => handleCampaignPayment(campaign)}
                                variant="ghost"
                                size="sm"
                                className="text-snow/70 hover:text-green-500"
                              >
                                Pay
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <PaymentOverview />
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-snow">Payment Management</CardTitle>
                  <CardDescription className="text-snow/60">
                    Overview of your payment activities and pending transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-snow/80">
                    Use the Transactions and Milestones tabs to manage your payments in detail.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="milestones">
            <MilestoneManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Campaign Payment Dialog */}
      {selectedCampaign && (
        <RazorpayPayment
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedCampaign(null);
          }}
          onSuccess={() => {
            toast({
              title: "Payment successful",
              description: `Payment for ${selectedCampaign.name} has been processed successfully.`,
            });
            setPaymentDialogOpen(false);
            setSelectedCampaign(null);
          }}
          campaignId={selectedCampaign.id}
          amount={selectedCampaign.budget - selectedCampaign.spent}
          description={`Payment for ${selectedCampaign.name} campaign`}
        />
      )}
    </div>
  );
};

export default Dashboard;
