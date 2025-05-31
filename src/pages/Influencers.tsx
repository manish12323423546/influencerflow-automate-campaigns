
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Users, TrendingUp, MessageCircle, Eye, Heart, ArrowUpDown } from 'lucide-react';

interface InfluencerData {
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

// Mock influencers data
const mockInfluencers: InfluencerData[] = [
  {
    id: '1',
    handle: '@techinfluencer',
    name: 'Tech Influencer',
    avatar_url: '/placeholder.svg',
    platform: 'instagram',
    industry: 'Technology',
    language: 'English',
    followers_count: 125000,
    engagement_rate: 4.8,
    audience_fit_score: 92,
    avg_cpe: 2.5,
    roi_index: 3.2,
    fake_follower_score: 95,
    safety_scan_score: 98,
    risk_flags: null
  },
  {
    id: '2',
    handle: '@fashionista',
    name: 'Fashion Creator',
    avatar_url: '/placeholder.svg',
    platform: 'instagram',
    industry: 'Fashion',
    language: 'English',
    followers_count: 89000,
    engagement_rate: 6.2,
    audience_fit_score: 88,
    avg_cpe: 3.1,
    roi_index: 2.8,
    fake_follower_score: 92,
    safety_scan_score: 95,
    risk_flags: null
  },
  {
    id: '3',
    handle: '@fitnessguru',
    name: 'Fitness Expert',
    avatar_url: '/placeholder.svg',
    platform: 'youtube',
    industry: 'Fitness',
    language: 'English',
    followers_count: 250000,
    engagement_rate: 5.5,
    audience_fit_score: 90,
    avg_cpe: 2.8,
    roi_index: 3.5,
    fake_follower_score: 97,
    safety_scan_score: 99,
    risk_flags: null
  },
  {
    id: '4',
    handle: '@beautyqueen',
    name: 'Beauty Blogger',
    avatar_url: '/placeholder.svg',
    platform: 'tiktok',
    industry: 'Beauty',
    language: 'English',
    followers_count: 180000,
    engagement_rate: 7.1,
    audience_fit_score: 85,
    avg_cpe: 2.2,
    roi_index: 4.1,
    fake_follower_score: 94,
    safety_scan_score: 96,
    risk_flags: null
  }
];

const Influencers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [audienceSizeFilter, setAudienceSizeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('followers');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [influencers, setInfluencers] = useState<InfluencerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setInfluencers(mockInfluencers);
      setIsLoading(false);
    }, 500);
  }, []);

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  const getAudienceSize = (followers: number) => {
    if (followers >= 1000000) return 'mega';
    if (followers >= 100000) return 'macro';
    if (followers >= 10000) return 'mid-tier';
    return 'micro';
  };

  const getRiskLevel = (riskFlags: string[] | null, safetyScore: number) => {
    if (!riskFlags || riskFlags.length === 0) {
      if (safetyScore >= 90) return 'low';
      if (safetyScore >= 70) return 'medium';
      return 'high';
    }
    if (riskFlags.length >= 3) return 'high';
    if (riskFlags.length >= 1) return 'medium';
    return 'low';
  };

  // Enhanced filtering logic
  const filteredInfluencers = influencers.filter(influencer => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!influencer.name.toLowerCase().includes(searchLower) && 
          !influencer.handle.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    // Platform filter
    if (platformFilter !== 'all' && influencer.platform !== platformFilter) {
      return false;
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
    if (audienceSizeFilter !== 'all' && getAudienceSize(influencer.followers_count) !== audienceSizeFilter) {
      return false;
    }
    
    // Risk filter
    if (riskFilter !== 'all' && getRiskLevel(influencer.risk_flags, influencer.safety_scan_score) !== riskFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'followers':
        aValue = a.followers_count;
        bValue = b.followers_count;
        break;
      case 'engagement':
        aValue = a.engagement_rate;
        bValue = b.engagement_rate;
        break;
      case 'cpe':
        aValue = a.avg_cpe;
        bValue = b.avg_cpe;
        break;
      case 'roi':
        aValue = a.roi_index;
        bValue = b.roi_index;
        break;
      default:
        aValue = a.followers_count;
        bValue = b.followers_count;
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // Get unique values for filters
  const uniquePlatforms = [...new Set(influencers.map(i => i.platform))];
  const uniqueIndustries = [...new Set(influencers.map(i => i.industry))];
  const uniqueLanguages = [...new Set(influencers.map(i => i.language))];

  const handleInfluencerClick = (influencerId: string) => {
    navigate(`/influencers/${influencerId}`);
  };

  const handleShortlist = (influencerId: string, influencerName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Added to shortlist",
      description: `${influencerName} has been added to your shortlist.`,
    });
  };

  const handleOutreach = (influencerId: string, influencerName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Outreach initiated",
      description: `Outreach message sent to ${influencerName}.`,
    });
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-500/10 text-green-500';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'high':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-carbon">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-space font-bold text-snow">
                Creator<span className="text-coral">Discovery</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline" 
                className="border-zinc-700 text-snow hover:bg-zinc-800"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-snow flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search & Filter Creators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
              <Input
                placeholder="Search influencers by handle or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-purple-500 pl-10"
              />
            </div>
            
            {/* Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Platform Filter */}
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {uniquePlatforms.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Industry Filter */}
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Industries</SelectItem>
                  {uniqueIndustries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Language Filter */}
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Languages</SelectItem>
                  {uniqueLanguages.map(language => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Audience Size Filter */}
              <Select value={audienceSizeFilter} onValueChange={setAudienceSizeFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Audience Size" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="micro">Micro (0-10K)</SelectItem>
                  <SelectItem value="mid-tier">Mid-tier (10K-100K)</SelectItem>
                  <SelectItem value="macro">Macro (100K-1M)</SelectItem>
                  <SelectItem value="mega">Mega (1M+)</SelectItem>
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-snow">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="cpe">CPE</SelectItem>
                  <SelectItem value="roi">ROI Index</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-snow">
            Influencer Leaderboard ({filteredInfluencers.length} influencers)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleSort(sortBy)}
            className="border-zinc-700 text-snow hover:bg-zinc-800"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-snow/60">
            Loading influencers...
          </div>
        )}

        {/* Creator Cards Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInfluencers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-snow/60">
                No influencers found. Try adjusting your filters.
              </div>
            ) : (
              filteredInfluencers.map((influencer) => {
                const riskLevel = getRiskLevel(influencer.risk_flags, influencer.safety_scan_score);
                
                return (
                  <Card 
                    key={influencer.id}
                    className="bg-zinc-900 border-zinc-800 hover:border-coral transition-colors cursor-pointer group"
                    onClick={() => handleInfluencerClick(influencer.id)}
                  >
                    <CardContent className="p-6">
                      {/* Creator Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={influencer.avatar_url || '/placeholder.svg'} 
                            alt={influencer.name} 
                          />
                          <AvatarFallback className="bg-purple-500 text-white">
                            {influencer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-snow truncate">{influencer.name}</p>
                          <p className="text-sm text-snow/60 truncate">{influencer.handle}</p>
                        </div>
                      </div>

                      {/* Creator Stats */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-snow/70 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Followers
                          </span>
                          <span className="text-sm font-medium text-snow">
                            {formatFollowers(influencer.followers_count)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-snow/70 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Engagement
                          </span>
                          <span className="text-sm font-medium text-snow">
                            {influencer.engagement_rate.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-snow/70">Avg CPE</span>
                          <span className="text-sm font-medium text-snow">
                            ${influencer.avg_cpe.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-snow/70">ROI Index</span>
                          <span className="text-sm font-medium text-snow">
                            {influencer.roi_index.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                          {influencer.industry}
                        </Badge>
                        <Badge variant="outline" className="border-coral/30 text-coral text-xs">
                          {influencer.platform}
                        </Badge>
                        <Badge className={`${getRiskBadgeColor(riskLevel)} text-xs`}>
                          {riskLevel} risk
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={(e) => handleShortlist(influencer.id, influencer.name, e)}
                          className="flex-1 bg-coral hover:bg-coral/90 text-white text-xs"
                        >
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleOutreach(influencer.id, influencer.name, e)}
                          className="flex-1 border-zinc-700 text-snow hover:bg-zinc-800 text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Outreach
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Influencers;
