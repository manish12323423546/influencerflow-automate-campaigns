
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Users, TrendingUp, MessageSquare, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  niche: string;
  location: string;
  rate_per_post: number;
  isShortlisted?: boolean;
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahj_tech',
    avatar_url: '/placeholder.svg',
    platform: 'Instagram',
    followers_count: 125000,
    engagement_rate: 4.8,
    niche: 'Technology',
    location: 'San Francisco, CA',
    rate_per_post: 2500,
    isShortlisted: false
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@mikefitness',
    avatar_url: '/placeholder.svg',
    platform: 'YouTube',
    followers_count: 89000,
    engagement_rate: 6.2,
    niche: 'Fitness',
    location: 'Los Angeles, CA',
    rate_per_post: 1800,
    isShortlisted: true
  },
  {
    id: '3',
    name: 'Emma Style',
    handle: '@emmastyle',
    avatar_url: '/placeholder.svg',
    platform: 'Instagram',
    followers_count: 95000,
    engagement_rate: 5.5,
    niche: 'Fashion',
    location: 'New York, NY',
    rate_per_post: 2200,
    isShortlisted: false
  }
];

const DiscoverCreators = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [nicheFilter, setNicheFilter] = useState('all');
  const [creators, setCreators] = useState<Creator[]>(mockCreators);

  const filteredCreators = creators.filter(creator => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!creator.name.toLowerCase().includes(searchLower) && 
          !creator.handle.toLowerCase().includes(searchLower) &&
          !creator.niche.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    
    if (platformFilter !== 'all' && creator.platform.toLowerCase() !== platformFilter) {
      return false;
    }
    
    if (nicheFilter !== 'all' && creator.niche.toLowerCase() !== nicheFilter.toLowerCase()) {
      return false;
    }
    
    return true;
  });

  const handleShortlist = (creatorId: string) => {
    setCreators(prev => 
      prev.map(creator => 
        creator.id === creatorId 
          ? { ...creator, isShortlisted: !creator.isShortlisted }
          : creator
      )
    );
    
    const creator = creators.find(c => c.id === creatorId);
    toast({
      title: creator?.isShortlisted ? "Removed from shortlist" : "Added to shortlist",
      description: `${creator?.name} has been ${creator?.isShortlisted ? 'removed from' : 'added to'} your shortlist.`,
    });
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'youtube':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'tiktok':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
          <Input
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-snow placeholder:text-snow/50 focus:border-coral pl-10"
          />
        </div>
        
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
          </SelectContent>
        </Select>

        <Select value={nicheFilter} onValueChange={setNicheFilter}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
            <SelectValue placeholder="Niche" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">All Niches</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="fitness">Fitness</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="lifestyle">Lifestyle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Influencer Leaderboard */}
      <div>
        <h2 className="text-2xl font-semibold text-snow mb-4">Influencer Leaderboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="bg-zinc-800/50 border-zinc-700 hover:border-coral/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={creator.avatar_url}
                      alt={creator.name}
                      className="h-12 w-12 rounded-full"
                    />
                    <div>
                      <CardTitle className="text-lg text-snow">{creator.name}</CardTitle>
                      <p className="text-snow/60 text-sm">{creator.handle}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShortlist(creator.id)}
                    className={creator.isShortlisted ? 'text-coral' : 'text-snow/70 hover:text-coral'}
                  >
                    <Heart className={`h-4 w-4 ${creator.isShortlisted ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getPlatformColor(creator.platform)}>
                    {creator.platform}
                  </Badge>
                  <Badge variant="outline" className="border-zinc-600 text-snow/70">
                    {creator.niche}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-coral" />
                    <span className="text-snow/80">{creator.followers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-coral" />
                    <span className="text-snow/80">{creator.engagement_rate}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-coral" />
                    <span className="text-snow/80">${creator.rate_per_post}</span>
                  </div>
                </div>

                <p className="text-snow/60 text-sm">{creator.location}</p>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleShortlist(creator.id)}
                    variant={creator.isShortlisted ? "default" : "outline"}
                    size="sm"
                    className={creator.isShortlisted 
                      ? "bg-coral hover:bg-coral/90 text-white flex-1" 
                      : "border-zinc-700 text-snow hover:bg-zinc-800 flex-1"
                    }
                  >
                    {creator.isShortlisted ? 'Shortlisted' : 'Shortlist Creator'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredCreators.length === 0 && (
        <div className="text-center py-12">
          <p className="text-snow/60 text-lg">No creators found matching your criteria.</p>
          <p className="text-snow/40 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default DiscoverCreators;
