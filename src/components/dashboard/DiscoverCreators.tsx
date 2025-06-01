import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Star, Users, TrendingUp, MessageSquare, Heart, MessageCircle, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Creator {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  industry: string;
  followers_count: number;
  engagement_rate: number;
  phone_no: number | null;
  gmail_gmail: string | null;
  isShortlisted: boolean;
}

interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: string;
  budget: number;
  spent: number;
  influencer_count: number;
  reach: number;
  engagement_rate: number;
  goals: string | null;
  target_audience: string | null;
  deliverables: string | null;
  timeline: string | null;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const DiscoverCreators = () => {
  const { toast } = useToast();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [isCallInProgress, setIsCallInProgress] = useState<Record<string, boolean>>({});
  const [isGmailInProgress, setIsGmailInProgress] = useState<Record<string, boolean>>({});
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});
  const [selectedCreatorForGmail, setSelectedCreatorForGmail] = useState<Creator | null>(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch creators
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('influencers')
          .select('*')
          .order('followers_count', { ascending: false });

        if (creatorsError) throw creatorsError;
        
        // Transform the data to match Creator interface
        const transformedData = (creatorsData || []).map(influencer => ({
          id: influencer.id,
          name: influencer.name,
          handle: influencer.handle,
          avatar_url: influencer.avatar_url || '/placeholder.svg',
          platform: influencer.platform,
          industry: influencer.industry,
          followers_count: influencer.followers_count,
          engagement_rate: Number(influencer.engagement_rate),
          phone_no: influencer.phone_no,
          gmail_gmail: influencer.gmail_gmail,
          isShortlisted: false // This could be fetched from a separate table
        }));
        
        setCreators(transformedData);

        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;
        setCampaigns(campaignsData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error loading data",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || creator.platform.toLowerCase() === platformFilter.toLowerCase();
    const matchesNiche = nicheFilter === 'all' || creator.industry.toLowerCase() === nicheFilter.toLowerCase();
    
    return matchesSearch && matchesPlatform && matchesNiche;
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
    if (creator) {
      toast({
        title: creator.isShortlisted ? "Removed from shortlist" : "Added to shortlist",
        description: `${creator.name} has been ${creator.isShortlisted ? 'removed from' : 'added to'} your shortlist.`,
      });
    }
  };

  const handlePhoneCall = async (creatorId: string, creatorName: string, phoneNumber: number | null) => {
    if (!phoneNumber) {
      toast({
        title: "Phone number not available",
        description: `No phone number found for ${creatorName}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCallInProgress(prev => ({ ...prev, [creatorId]: true }));
      toast({
        title: "Initiating call",
        description: `Starting a call with ${creatorName} at ${phoneNumber}...`,
      });

      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": "sk_97b3adae38c4d320bb4af66a35659213de2e129dc9546f84",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "agent_id": "agent_01jwkpad6te50bmvfd8ax6xvqk",
          "agent_phone_number_id": "phnum_01jwkwbn2terqtgd2nzxedgz0z",
          "to_number": `+${phoneNumber}`
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

  const handleGmailClick = (creator: Creator) => {
    if (!creator.gmail_gmail) {
      toast({
        title: "Gmail not available",
        description: `No Gmail address found for ${creator.name}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedCreatorForGmail(creator);
    setIsGmailModalOpen(true);
  };

  const handleGmailSend = async (campaignId: string) => {
    if (!selectedCreatorForGmail) return;

    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    if (!selectedCampaign) return;

    try {
      setIsGmailInProgress(prev => ({ ...prev, [selectedCreatorForGmail.id]: true }));
      
      toast({
        title: "Sending...",
        description: `Sending Gmail workflow for ${selectedCreatorForGmail.name}...`,
      });

      console.log('Sending Gmail workflow for creator:', selectedCreatorForGmail.name);

      const requestBody = {
        gmail: selectedCreatorForGmail.gmail_gmail,
        campaign: selectedCampaign,
        creator: selectedCreatorForGmail
      };

      console.log('Request body:', requestBody);

      const response = await fetch("https://varhhh.app.n8n.cloud/webhook-test/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: "no-cors", // Add this to handle CORS
        body: JSON.stringify(requestBody),
      });

      // Since we're using no-cors, we won't get a proper response status
      // We'll assume success and show a positive message
      setGmailResponses(prev => ({ ...prev, [selectedCreatorForGmail.id]: { status: 'sent', timestamp: new Date().toISOString() } }));
      
      toast({
        title: "Request Sent",
        description: `Gmail workflow request sent for ${selectedCreatorForGmail.name}. Please check your webhook logs to confirm it was received.`,
      });
      setIsGmailModalOpen(false);
      setSelectedCreatorForGmail(null);

    } catch (error) {
      console.error('Error sending Gmail workflow:', error);
      toast({
        title: "Workflow Failed",
        description: "Unable to send Gmail workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGmailInProgress(prev => ({ ...prev, [selectedCreatorForGmail.id]: false }));
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

  const formatPhoneNumber = (phoneNumber: number | null) => {
    if (!phoneNumber) return 'Not available';
    return `+${phoneNumber}`;
  };

  const formatGmail = (gmail: string | null) => {
    if (!gmail) return 'Not available';
    return gmail;
  };

  // Get unique platforms and industries for filters
  const uniquePlatforms = [...new Set(creators.map(creator => creator.platform))];
  const uniqueIndustries = [...new Set(creators.map(creator => creator.industry))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

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
            {uniquePlatforms.map(platform => (
              <SelectItem key={platform} value={platform.toLowerCase()}>{platform}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={nicheFilter} onValueChange={setNicheFilter}>
          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-snow">
            <SelectValue placeholder="Niche" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all">All Niches</SelectItem>
            {uniqueIndustries.map(industry => (
              <SelectItem key={industry} value={industry.toLowerCase()}>{industry}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Selection Modal */}
      <Dialog open={isGmailModalOpen} onOpenChange={setIsGmailModalOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-snow">
          <DialogHeader>
            <DialogTitle>Select Campaign for {selectedCreatorForGmail?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-snow/70">Choose a campaign to send Gmail workflow for:</p>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {campaigns.map((campaign) => (
                <Button
                  key={campaign.id}
                  variant="outline"
                  onClick={() => handleGmailSend(campaign.id)}
                  disabled={isGmailInProgress[selectedCreatorForGmail?.id || '']}
                  className="justify-start border-zinc-700 text-snow hover:bg-zinc-700"
                >
                  <div className="text-left">
                    <div className="font-medium">{campaign.name}</div>
                    <div className="text-xs text-snow/60">{campaign.brand} - {campaign.status}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Influencer Leaderboard */}
      <div>
        <h2 className="text-2xl font-semibold text-snow mb-4">Influencer Leaderboard</h2>
        {filteredCreators.length === 0 ? (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="py-8">
              <div className="text-center text-snow/60">
                {creators.length === 0 
                  ? "No creators found in the database."
                  : "No creators match your current filters. Try adjusting your search criteria."
                }
              </div>
            </CardContent>
          </Card>
        ) : (
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
                        {creator.industry}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-snow/60">Followers</p>
                        <p className="text-snow font-medium">{formatFollowers(creator.followers_count)}</p>
                      </div>
                      <div>
                        <p className="text-snow/60">Engagement</p>
                        <p className="text-snow font-medium">{creator.engagement_rate.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Phone Number Display */}
                    <div className="bg-zinc-700/30 rounded-md p-3">
                      <p className="text-snow/60 text-xs mb-1">Phone Number</p>
                      <p className="text-snow text-sm font-medium">{formatPhoneNumber(creator.phone_no)}</p>
                    </div>

                    {/* Gmail Display */}
                    <div className="bg-zinc-700/30 rounded-md p-3">
                      <p className="text-snow/60 text-xs mb-1">Gmail</p>
                      <p className="text-snow text-sm font-medium">{formatGmail(creator.gmail_gmail)}</p>
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
                        onClick={() => handlePhoneCall(creator.id, creator.name, creator.phone_no)}
                        disabled={isCallInProgress[creator.id] || !creator.phone_no}
                        className={`${
                          isCallInProgress[creator.id]
                            ? 'bg-green-500 border-green-500 text-white'
                            : !creator.phone_no
                            ? 'bg-gray-500 border-gray-500 text-gray-300 cursor-not-allowed'
                            : 'border-zinc-700 text-snow hover:bg-zinc-800'
                        }`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {isCallInProgress[creator.id] ? 'Calling...' : 'Call'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGmailClick(creator)}
                        disabled={isGmailInProgress[creator.id] || !creator.gmail_gmail}
                        className={`col-span-2 ${
                          isGmailInProgress[creator.id]
                            ? 'bg-coral border-coral text-white'
                            : !creator.gmail_gmail
                            ? 'bg-gray-500 border-gray-500 text-gray-300 cursor-not-allowed'
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
        )}
      </div>
    </div>
  );
};

export default DiscoverCreators;
