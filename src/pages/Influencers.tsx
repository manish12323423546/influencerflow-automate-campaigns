import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, MoreHorizontal, ArrowLeft, Bell, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { InfluencerDrawer } from '@/components/InfluencerDrawer';
import { Link } from 'react-router-dom';

interface Influencer {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  platform: string;
  industry: string;
  language: string;
  followers_count: number;
  engagement_rate: number;
  audience_fit_score: number;
  avg_cpe: number;
  roi_index: number;
  fake_follower_score: number;
  safety_scan_score: number;
  risk_flags: string[] | null;
}

const Influencers = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [audienceSizeFilter, setAudienceSizeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Simplified query to fetch all influencers first
  const { data: influencers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['influencers'],
    queryFn: async () => {
      console.log('Fetching all influencers...');
      
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .order('roi_index', { ascending: false });
      
      console.log('Raw query result:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully fetched influencers:', data?.length || 0);
      return (data || []) as Influencer[];
    },
  });

  // Filter influencers client-side
  const filteredInfluencers = influencers.filter(influencer => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!influencer.handle.toLowerCase().includes(searchLower) && 
          !influencer.name.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Industry filter
    if (industryFilter !== 'all' && influencer.industry !== industryFilter) {
      return false;
    }
    
    // Language filter
    if (languageFilter !== 'all' && influencer.language !== languageFilter) {
      return false;
    }
    
    // Audience size filter
    if (audienceSizeFilter !== 'all') {
      switch (audienceSizeFilter) {
        case 'micro':
          if (influencer.followers_count >= 100000) return false;
          break;
        case 'mid':
          if (influencer.followers_count < 100000 || influencer.followers_count >= 1000000) return false;
          break;
        case 'macro':
          if (influencer.followers_count < 1000000) return false;
          break;
      }
    }
    
    // Risk filter
    if (riskFilter !== 'all') {
      if (riskFilter === 'clean') {
        if (influencer.risk_flags && influencer.risk_flags.length > 0) return false;
      } else {
        if (!influencer.risk_flags || influencer.risk_flags.length === 0) return false;
      }
    }
    
    return true;
  });

  // Get unique filter values from all influencers
  const industries = [...new Set(influencers.map(inf => inf.industry))];
  const languages = [...new Set(influencers.map(inf => inf.language))];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      console.error('Query error:', error);
      toast({
        title: "Error loading influencers",
        description: error.message || "There was a problem loading the influencer data.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Add a manual refresh function for debugging
  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    refetch();
  };

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

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getRiskBadgeColor = (flags: string[] | null) => {
    if (!flags || flags.length === 0) return 'bg-green-500/10 text-green-500';
    if (flags.some(flag => flag.includes('high-risk'))) return 'bg-red-500/10 text-red-500';
    return 'bg-yellow-500/10 text-yellow-500';
  };

  const handleInfluencerClick = (influencer: Influencer) => {
    navigate(`/influencers/${influencer.id}`);
  };

  const handleInfluencerRowClick = (influencer: Influencer, event: React.MouseEvent) => {
    // Prevent navigation if clicking on the more actions button
    if ((event.target as HTMLElement).closest('[data-action-button]')) {
      event.stopPropagation();
      setSelectedInfluencer(influencer);
      setDrawerOpen(true);
      return;
    }
    
    handleInfluencerClick(influencer);
  };

  if (!user) return null;

  console.log('Render state:', { 
    isLoading, 
    totalInfluencers: influencers.length, 
    filteredCount: filteredInfluencers.length,
    error: error?.message 
  });

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
                Influencer<span className="text-purple-500">Flow</span> • Influencers
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-zinc-700 text-snow/70 hover:text-purple-500 hover:border-purple-500"
              >
                Refresh
              </Button>
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
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-zinc-800 rounded-lg text-snow text-sm">
            <p>Debug: Total influencers: {influencers.length}</p>
            <p>Debug: Filtered influencers: {filteredInfluencers.length}</p>
            <p>Debug: Loading: {isLoading.toString()}</p>
            <p>Debug: Error: {error?.message || 'None'}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
              <Input
                placeholder="Search influencers by handle or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map(language => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={audienceSizeFilter} onValueChange={setAudienceSizeFilter}>
                <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Audience Size" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="micro">Micro (&lt; 100K)</SelectItem>
                  <SelectItem value="mid">Mid (100K - 1M)</SelectItem>
                  <SelectItem value="macro">Macro (&gt; 1M)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Influencers Leaderboard */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">
              Influencer Leaderboard
              {isLoading && <span className="text-sm font-normal text-snow/60 ml-2">(Loading...)</span>}
              {!isLoading && <span className="text-sm font-normal text-snow/60 ml-2">({filteredInfluencers.length} influencers)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-snow/60">
                Loading influencer data...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                Error loading influencers: {error.message}
                <br />
                <Button onClick={handleRefresh} className="mt-4" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredInfluencers.length === 0 ? (
              <div className="p-8 text-center text-snow/60">
                {influencers.length === 0 
                  ? "No influencers found in database. Please add some influencer data first."
                  : "No influencers match your current filters. Try adjusting your search criteria."
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-snow/80">Influencer</TableHead>
                    <TableHead className="text-snow/80">Category</TableHead>
                    <TableHead className="text-snow/80">Platform</TableHead>
                    <TableHead className="text-snow/80">Followers</TableHead>
                    <TableHead className="text-snow/80">Audience Fit</TableHead>
                    <TableHead className="text-snow/80">Engagement</TableHead>
                    <TableHead className="text-snow/80">Avg CPE</TableHead>
                    <TableHead className="text-snow/80">ROI Index</TableHead>
                    <TableHead className="text-snow/80">Risk Status</TableHead>
                    <TableHead className="text-snow/80"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfluencers.map((influencer, index) => (
                    <motion.tr
                      key={influencer.id}
                      className="border-zinc-800 cursor-pointer"
                      whileHover={{ y: -2, backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
                      onClick={(event) => handleInfluencerRowClick(influencer, event)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TableCell className="font-medium text-snow">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={influencer.avatar_url || ''} alt={influencer.name} />
                            <AvatarFallback className="bg-purple-500 text-white">
                              {influencer.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{influencer.name}</p>
                            <p className="text-sm text-snow/60">{influencer.handle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-snow/80">
                        <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                          {influencer.industry}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">
                        <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                          {influencer.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">{formatFollowers(influencer.followers_count)}</TableCell>
                      <TableCell className="text-snow/80">{influencer.audience_fit_score.toFixed(1)}/10</TableCell>
                      <TableCell className="text-snow/80">{influencer.engagement_rate.toFixed(1)}%</TableCell>
                      <TableCell className="text-snow/80">${influencer.avg_cpe.toFixed(2)}</TableCell>
                      <TableCell className="text-snow/80">{influencer.roi_index.toFixed(1)}</TableCell>
                      <TableCell>
                        <Badge className={getRiskBadgeColor(influencer.risk_flags)}>
                          {!influencer.risk_flags || influencer.risk_flags.length === 0 ? 'Clean' : `${influencer.risk_flags.length} Flag${influencer.risk_flags.length > 1 ? 's' : ''}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-snow/60 hover:text-snow"
                          data-action-button
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Influencer Drawer */}
      <InfluencerDrawer
        influencer={selectedInfluencer}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};

export default Influencers;
