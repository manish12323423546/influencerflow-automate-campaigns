
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Users, TrendingUp, MessageSquare, Heart, MessageCircle, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { conversationalAIService } from '@/services/conversationalAI';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  niche: string;
  followers_count: number;
  engagement_rate: number;
  isShortlisted: boolean;
}

const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    handle: '@sarahj_tech',
    avatar_url: '/placeholder.svg',
    platform: 'Instagram',
    niche: 'Technology',
    followers_count: 125000,
    engagement_rate: 4.8,
    isShortlisted: false
  },
  {
    id: '2',
    name: 'Mike Chen',
    handle: '@mikefitness',
    avatar_url: '/placeholder.svg',
    platform: 'YouTube',
    niche: 'Fitness',
    followers_count: 250000,
    engagement_rate: 5.5,
    isShortlisted: true
  },
  {
    id: '3',
    name: 'Emma Style',
    handle: '@emmastyle',
    avatar_url: '/placeholder.svg',
    platform: 'TikTok',
    niche: 'Fashion',
    followers_count: 180000,
    engagement_rate: 7.1,
    isShortlisted: false
  }
];

const DiscoverCreators = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [isCallInProgress, setIsCallInProgress] = useState<Record<string, boolean>>({});
  const [isGmailInProgress, setIsGmailInProgress] = useState<Record<string, boolean>>({});
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});

  const filteredCreators = mockCreators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || creator.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesNiche = nicheFilter === 'all' || creator.niche.toLowerCase() === nicheFilter.toLowerCase();
    
    return matchesSearch && matchesPlatform && matchesNiche;
  });

  const handleShortlist = (creatorId: string) => {
    const creator = mockCreators.find(c => c.id === creatorId);
    if (creator) {
      toast({
        title: creator.isShortlisted ? "Removed from shortlist" : "Added to shortlist",
        description: `${creator.name} has been ${creator.isShortlisted ? 'removed from' : 'added to'} your shortlist.`,
      });
    }
  };

  const handlePhoneCall = async (creatorId: string, creatorName: string) => {
    try {
      setIsCallInProgress(prev => ({ ...prev, [creatorId]: true }));
      toast({
        title: "Initiating call",
        description: `Starting a call with ${creatorName}...`,
      });

      const response = await fetch("https://api.elevenlabs.io//v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": "sk_97b3adae38c4d320bb4af66a35659213de2e129dc9546f84",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "agent_id": "agent_01jwkpad6te50bmvfd8ax6xvqk",
          "agent_phone_number_id": "phnum_01jwkwbn2terqtgd2nzxedgz0z",
          "to_number": "+918140030507" // In a real app, this would come from the creator's data
        }),
      });

      const body = await response.json();
      console.log(body);

      if (response.ok) {
        toast({
          title: "Call initiated",
          description: `Connected with ${creatorName}`,
        });
      } else {
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Call failed",
        description: "Unable to initiate the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCallInProgress(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  const handleGmailSend = async (creatorId: string, creatorName: string) => {
    try {
      setIsGmailInProgress(prev => ({ ...prev, [creatorId]: true }));
      
      toast({
        title: "Sending...",
        description: `Sending workflow for ${creatorName}...`,
      });

      console.log('Sending Gmail workflow for creator:', creatorName);

      const response = await fetch("https://varhhh.app.n8n.cloud/webhook/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "Send": "Send"
        }),
      });

      const responseData = await response.json();
      console.log('Gmail workflow response:', responseData);

      if (response.ok) {
        setGmailResponses(prev => ({ ...prev, [creatorId]: responseData }));
        
        toast({
          title: "Workflow Successful",
          description: `Gmail workflow completed for ${creatorName} (200 OK)`,
        });
      } else {
        throw new Error(`Failed to send workflow: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending Gmail workflow:', error);
      toast({
        title: "Workflow Failed",
        description: "Unable to send Gmail workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGmailInProgress(prev => ({ ...prev, [creatorId]: false }));
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
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-500">
                      {creator.platform}
                    </Badge>
                    <Badge variant="outline" className="border-purple-500/30 text-purple-500">
                      {creator.niche}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-snow/60">Followers</p>
                      <p className="text-snow font-medium">{formatFollowers(creator.followers_count)}</p>
                    </div>
                    <div>
                      <p className="text-snow/60">Engagement</p>
                      <p className="text-snow font-medium">{creator.engagement_rate}%</p>
                    </div>
                  </div>

                  {/* Gmail Response Display */}
                  {gmailResponses[creator.id] && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 mt-3">
                      <p className="text-green-500 text-sm font-medium mb-2">Workflow Response (200 OK):</p>
                      <pre className="text-xs text-green-400 overflow-auto max-h-20">
                        {JSON.stringify(gmailResponses[creator.id], null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-snow hover:bg-zinc-800"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePhoneCall(creator.id, creator.name)}
                      disabled={isCallInProgress[creator.id]}
                      className={`${
                        isCallInProgress[creator.id]
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-zinc-700 text-snow hover:bg-zinc-800'
                      }`}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {isCallInProgress[creator.id] ? 'Calling...' : 'Call'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGmailSend(creator.id, creator.name)}
                      disabled={isGmailInProgress[creator.id]}
                      className={`col-span-2 ${
                        isGmailInProgress[creator.id]
                          ? 'bg-coral border-coral text-white'
                          : 'border-zinc-700 text-snow hover:bg-zinc-800'
                      }`}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {isGmailInProgress[creator.id] ? 'Sending...' : 'Gmail'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoverCreators;
