import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import ConversationsManager from './ConversationsManager';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageSquare, Phone, Mail, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  phone_no: string | null;
  gmail_gmail: string | null;
  campaigns: Campaign[];
}

interface SupabaseInfluencer {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  phone_no: string | null;
  gmail_gmail: string | null;
}

interface SupabaseResponse {
  campaign: {
    id: string;
    name: string;
    status: string;
  };
  influencer: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string | null;
    platform: string;
    followers_count: number;
    engagement_rate: number;
    phone_no: string | null;
    gmail_gmail: string | null;
  };
}

export default function OutreachManager() {
  const [activeTab, setActiveTab] = useState('outreaches');
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);
      
      // Get influencers that are attached to campaigns through campaign_influencers table
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select(`
          campaign:campaigns!inner (
            id,
            name,
            status
          ),
          influencer:influencers!inner (
            id,
            name,
            handle,
            avatar_url,
            platform,
            followers_count,
            engagement_rate,
            phone_no,
            gmail_gmail
          )
        `)
        .eq('campaign.status', 'active');

      if (error) {
        console.error('Error fetching influencers:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setInfluencers([]);
        return;
      }

      // Transform the data to match our Influencer interface
      const typedData = data as unknown as SupabaseResponse[];
      const influencerMap = new Map<string, Influencer>();
      
      typedData.forEach((item) => {
        if (!item.influencer) return;
        
        const existingInfluencer = influencerMap.get(item.influencer.id);
        
        if (existingInfluencer) {
          if (item.campaign && !existingInfluencer.campaigns.find(c => c.id === item.campaign.id)) {
            existingInfluencer.campaigns.push(item.campaign);
          }
        } else {
          influencerMap.set(item.influencer.id, {
            ...item.influencer,
            campaigns: item.campaign ? [item.campaign] : []
          });
        }
      });

      setInfluencers(Array.from(influencerMap.values()));
    } catch (error) {
      console.error('Error fetching influencers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch influencers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageClick = async (influencer: Influencer) => {
    try {
      // Check if conversation exists
      const { data: existingConv, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('influencer_id', influencer.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let conversationId;

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: insertError } = await supabase
          .from('conversations')
          .insert({
            brand_user_id: (await supabase.auth.getUser()).data.user?.id,
            influencer_id: influencer.id,
            last_message: 'Start a conversation',
            unread_count: 0
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        conversationId = newConv.id;
      }

      setActiveConversationId(conversationId);
      setSelectedInfluencer(influencer);
      setShowMessaging(true);
    } catch (error) {
      console.error('Error handling message click:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: "No phone number",
        description: "Phone number not available for this influencer",
        variant: "destructive",
      });
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    } else {
      toast({
        title: "No email",
        description: "Email not available for this influencer",
        variant: "destructive",
      });
    }
  };

  const filteredInfluencers = influencers.filter((influencer) =>
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Influencer Outreach</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search influencers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[300px] bg-white border-gray-200 text-gray-900 shadow-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex">
          {/* Left side: Tabs and Content */}
          <div className="flex-1">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full h-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="h-9 bg-gray-100 border border-gray-200">
                  <TabsTrigger value="outreaches" className="text-sm data-[state=active]:bg-coral data-[state=active]:text-white">
                    Outreaches
                  </TabsTrigger>
                  <TabsTrigger value="conversations" className="text-sm data-[state=active]:bg-coral data-[state=active]:text-white">
                    Conversations
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="outreaches" className="h-[calc(100%-4rem)]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search influencers..."
                        className="pl-8 bg-white border-gray-200 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_120px] gap-4 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-600">
                      <div>Influencer</div>
                      <div>Details</div>
                      <div>Status</div>
                      <div>Engagement</div>
                      <div>Followers</div>
                      <div>Actions</div>
                    </div>

                    {isLoading ? (
                      <div className="flex items-center justify-center py-8 text-gray-600">
                        Loading influencers...
                      </div>
                    ) : filteredInfluencers.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-gray-500">
                        No influencers found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredInfluencers.map((influencer) => (
                          <div
                            key={influencer.id}
                            className="grid grid-cols-[1fr_1fr_100px_100px_100px_120px] gap-4 items-center px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={influencer.avatar_url || '/placeholder-avatar.png'}
                                alt={influencer.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{influencer.name}</div>
                                <div className="text-sm text-gray-500">
                                  {influencer.handle}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {influencer.platform}
                              </div>
                              <div className="text-sm text-gray-500">
                                {influencer.campaigns.map(c => c.name).join(', ')}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {influencer.campaigns[0]?.status || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {influencer.engagement_rate}%
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Intl.NumberFormat().format(influencer.followers_count)}
                            </div>
                            <div className="flex items-center gap-2">
                              {influencer.phone_no && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCall(influencer.phone_no)}
                                  className="text-gray-600 hover:text-coral hover:bg-coral/10"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              {influencer.gmail_gmail && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEmail(influencer.gmail_gmail)}
                                  className="text-gray-600 hover:text-coral hover:bg-coral/10"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveTab('conversations')}
                                className="text-gray-600 hover:text-coral hover:bg-coral/10"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="conversations" className="h-[calc(100%-4rem)]">
                <ConversationsManager />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right side: Messaging Panel */}
          {showMessaging && selectedInfluencer && (
            <div className="w-[400px] border-l border-gray-200 relative bg-white">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMessaging(false);
                    setSelectedInfluencer(null);
                    setActiveConversationId(null);
                  }}
                  className="text-gray-600 hover:text-coral hover:bg-coral/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <iframe
                src={`/outreach?influencer=${selectedInfluencer.id}&conversation=${activeConversationId}`}
                className="w-full h-[calc(100vh-20rem)]"
                style={{ backgroundColor: '#FFFFFF' }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 