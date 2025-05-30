
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, ArrowLeft, Bell, Filter, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from '@/components/NotificationCenter';

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
  influencer_count?: number;
}

// Mock campaigns data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Tech Product Launch',
    description: 'Launch campaign for our new tech product line with focus on early adopters',
    goals: 'Increase brand awareness and drive pre-orders',
    target_audience: 'Tech enthusiasts, ages 25-45',
    budget: 15000,
    deliverables: 'Instagram posts, YouTube reviews, blog articles',
    timeline: '3 months',
    status: 'active',
    brand: 'TechCorp',
    user_id: 'mock-user-123',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    influencer_count: 5
  },
  {
    id: '2',
    name: 'Fashion Summer Collection',
    description: 'Promote our new summer fashion collection targeting young professionals',
    goals: 'Drive sales and increase social media engagement',
    target_audience: 'Fashion-conscious professionals, ages 22-35',
    budget: 8000,
    deliverables: 'Instagram stories, TikTok videos, outfit posts',
    timeline: '2 months',
    status: 'draft',
    brand: 'StyleBrand',
    user_id: 'mock-user-123',
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z',
    influencer_count: 3
  },
  {
    id: '3',
    name: 'Fitness App Promotion',
    description: 'Increase app downloads and engagement through fitness influencer partnerships',
    goals: 'Boost app downloads by 40% and increase user retention',
    target_audience: 'Fitness enthusiasts, ages 18-40',
    budget: 12000,
    deliverables: 'Workout videos, app reviews, fitness challenges',
    timeline: '6 weeks',
    status: 'completed',
    brand: 'FitLife',
    user_id: 'mock-user-123',
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-05T09:15:00Z',
    influencer_count: 7
  },
  {
    id: '4',
    name: 'Sustainable Beauty Line',
    description: 'Launch eco-friendly beauty products with sustainability-focused creators',
    goals: 'Build brand credibility and drive conscious consumer adoption',
    target_audience: 'Eco-conscious consumers, ages 25-50',
    budget: 20000,
    deliverables: 'Product reviews, sustainability content, tutorials',
    timeline: '4 months',
    status: 'pending',
    brand: 'GreenBeauty',
    user_id: 'mock-user-123',
    created_at: '2024-01-20T16:45:00Z',
    updated_at: '2024-01-20T16:45:00Z',
    influencer_count: 4
  }
];

const Campaigns = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data
  const mockUser = {
    id: 'mock-user-123',
    email: 'brand@example.com'
  };

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getCampaignStats = () => {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const pending = campaigns.filter(c => c.status === 'pending').length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    
    return { total, active, pending, completed, totalBudget };
  };

  const stats = getCampaignStats();

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center text-snow/70 hover:text-purple-500 transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Dashboard
              </Link>
              <h1 className="text-2xl font-space font-bold text-snow">
                Influencer<span className="text-purple-500">Flow</span> • Campaign Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button
                  onClick={() => setShowNotifications(true)}
                  variant="ghost"
                  size="sm"
                  className="text-snow/70 hover:text-purple-500 relative"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-snow">Welcome back!</p>
                  <p className="text-xs text-snow/60">{mockUser.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-snow/70">Total Campaigns</p>
                  <p className="text-2xl font-bold text-snow">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-snow/70">Active</p>
                  <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-snow/70">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-snow/70">Completed</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.completed}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-snow/70">Total Budget</p>
                  <p className="text-2xl font-bold text-snow">${stats.totalBudget.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search, Filters and Actions */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
              <Input
                placeholder="Search campaigns, brands, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10 w-80"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => navigate('/campaigns/create')}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Campaign
          </Button>
        </div>

        {/* Campaigns Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">Campaign List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-snow/60">Loading campaigns...</div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center text-snow/60">
                <p className="mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No campaigns match your current filters." 
                    : "No campaigns found. Create your first campaign to get started."
                  }
                </p>
                <Button
                  onClick={() => navigate('/campaigns/create')}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-snow/80">Campaign Name</TableHead>
                    <TableHead className="text-snow/80">Brand</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Budget</TableHead>
                    <TableHead className="text-snow/80">Influencers</TableHead>
                    <TableHead className="text-snow/80">Timeline</TableHead>
                    <TableHead className="text-snow/80">Created</TableHead>
                    <TableHead className="text-snow/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium text-snow">
                        <div className="cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                          <p className="font-medium hover:text-purple-500 transition-colors">{campaign.name}</p>
                          {campaign.description && (
                            <p className="text-sm text-snow/60 mt-1 line-clamp-1">{campaign.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-snow/80">{campaign.brand}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">
                        ${campaign.budget.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-snow/80">
                        <span className="text-purple-500 font-medium">{campaign.influencer_count}</span> selected
                      </TableCell>
                      <TableCell className="text-snow/80">
                        {campaign.timeline || 'Not set'}
                      </TableCell>
                      <TableCell className="text-snow/80">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                            variant="ghost"
                            size="sm"
                            className="text-snow/70 hover:text-purple-500"
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                            variant="ghost"
                            size="sm"
                            className="text-snow/70 hover:text-blue-500"
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default Campaigns;
