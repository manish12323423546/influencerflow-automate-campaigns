import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, ArrowLeft, Bell, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import NotificationCenter from '@/components/NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

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

const Campaigns = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  // Fetch campaigns data
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          campaign_influencers(count)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data.map(campaign => ({
        ...campaign,
        influencer_count: campaign.campaign_influencers?.[0]?.count || 0
      })) as Campaign[];
    },
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (!user) return null;

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
                Influencer<span className="text-purple-500">Flow</span> • Campaigns
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
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              <Button
                onClick={() => navigate('/settings')}
                variant="ghost"
                size="sm"
                className="text-snow/70 hover:text-purple-500"
              >
                <Settings className="h-6 w-6" />
              </Button>
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
        {/* Search and Create */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10"
            />
          </div>
          
          <Button
            onClick={() => navigate('/campaigns/create')}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>

        {/* Campaigns Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-snow/60">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-snow/60">
                <p className="mb-4">No campaigns found.</p>
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
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Budget</TableHead>
                    <TableHead className="text-snow/80">Influencers</TableHead>
                    <TableHead className="text-snow/80">Timeline</TableHead>
                    <TableHead className="text-snow/80">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign, index) => (
                    <motion.tr
                      key={campaign.id}
                      className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium text-snow">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          {campaign.description && (
                            <p className="text-sm text-snow/60 mt-1">{campaign.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">
                        ${campaign.budget.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-snow/80">
                        {campaign.influencer_count} selected
                      </TableCell>
                      <TableCell className="text-snow/80">
                        {campaign.timeline || 'Not set'}
                      </TableCell>
                      <TableCell className="text-snow/80">
                        {new Date(campaign.created_at).toLocaleDateString()}
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
