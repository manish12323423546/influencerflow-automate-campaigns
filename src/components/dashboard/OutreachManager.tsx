import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import ConversationsManager from './ConversationsManager';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageSquare, Phone, Mail, X, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  name: string;
  brand: string;
  description?: string;
  budget?: number;
  timeline?: string;
  deliverables?: string;
  status: string;
  created_at: string;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [selectedInfluencerForGmail, setSelectedInfluencerForGmail] = useState<Influencer | null>(null);
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});
  const [isGmailInProgress, setIsGmailInProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInfluencers();
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const handleEmailClick = (influencer: Influencer) => {
    if (!influencer.gmail_gmail) {
      toast({
        title: "Gmail not available",
        description: `No Gmail address found for ${influencer.name}.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedInfluencerForGmail(influencer);
    setIsGmailModalOpen(true);
  };

  const handleGmailSend = async (campaignId: string) => {
    if (!selectedInfluencerForGmail) return;

    const influencer = selectedInfluencerForGmail;
    const campaign = campaigns.find(c => c.id === campaignId);

    if (!campaign) {
      toast({
        title: "Campaign not found",
        description: "Selected campaign could not be found.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGmailInProgress(prev => ({ ...prev, [influencer.id]: true }));
      setIsGmailModalOpen(false);

      toast({
        title: "Sending...",
        description: `Sending Gmail workflow for ${influencer.name}...`,
      });

      // Get contract data from Supabase if available
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('influencer_id', influencer.id)
        .eq('brand_user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Parse timeline to get start and end dates, or use defaults
      const parseTimelineDate = (timeline: string | null) => {
        if (!timeline) return null;
        // Try to extract dates from timeline string (assuming format like "2025-01-01 to 2025-01-31")
        const dateMatch = timeline.match(/(\d{4}-\d{2}-\d{2})/g);
        return dateMatch || null;
      };

      const timelineDates = parseTimelineDate(campaign.timeline);
      const defaultStartDate = new Date().toISOString().slice(0, 10);
      const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const startDate = timelineDates?.[0] || defaultStartDate;
      const endDate = timelineDates?.[1] || defaultEndDate;

      // Get campaign influencer data for fee information - exactly like CampaignDetail
      const campaignInfluencer = influencer.campaigns.find(c => c.id === campaignId);
      const { data: campaignInfluencerData } = await supabase
        .from('campaign_influencers')
        .select('fee')
        .eq('campaign_id', campaignId)
        .eq('influencer_id', influencer.id)
        .single();

      const fee = campaignInfluencerData?.fee || 15000;

      // Prepare the request body in the exact format from CampaignDetail
      const requestBody = {
        competitionData: {
          campaignId: campaign.id || `cmp_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${campaign.name?.replace(/\s+/g, '').slice(0, 3).toUpperCase()}`,
          campaignName: campaign.name || "Campaign",
          competitorBrands: [
            {
              brandName: campaign.brand || "Brand",
              campaignBudget: campaign.budget || 0,
              startDate: startDate,
              endDate: endDate
            }
          ]
        },
        influencerDetail: {
          influencerId: influencer.id,
          name: influencer.name,
          gmail: influencer.gmail_gmail,
          socialHandles: {
            [influencer.platform]: influencer.handle || `@${influencer.name.toLowerCase().replace(/\s+/g, '')}`
          },
          followers: {
            [influencer.platform]: influencer.followers_count
          },
          engagementRate: influencer.engagement_rate,
          category: influencer.platform === 'instagram' ? 'Social Media' :
                   influencer.platform === 'youtube' ? 'Video Content' :
                   influencer.platform === 'tiktok' ? 'Short Form Video' : 'Content Creation'
        },
        contract: {
          contractId: contractData?.id || `ctr_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${influencer.id.slice(0, 3).toUpperCase()}`,
          contractType: "Fixed-Fee",
          startDate: startDate,
          endDate: endDate,
          deliverables: campaign.deliverables ? campaign.deliverables.split(',').map((item, index) => ({
            type: item.trim(),
            count: 1,
            dueDate: endDate
          })) : [
            {
              type: "Social Media Post",
              count: 1,
              dueDate: endDate
            }
          ],
          paymentTerms: {
            totalFee: campaignInfluencerData?.fee || 15000,
            currency: "INR",
            paymentSchedule: [
              {
                milestone: "After Content Delivery",
                amount: campaignInfluencerData?.fee || 15000,
                dueOn: endDate
              }
            ]
          },
          terminationClause: "Either party may terminate with 7 days' notice; refund or prorated payment applies if terminated early.",
          exclusivity: {
            applicable: true,
            category: influencer.platform === 'instagram' ? 'Social Media' :
                     influencer.platform === 'youtube' ? 'Video Content' :
                     influencer.platform === 'tiktok' ? 'Short Form Video' : 'Content Creation',
            duration: `${startDate} to ${endDate}`
          }
        }
      };

      console.log('Sending Gmail workflow with data:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://sdsd12.app.n8n.cloud/webhook/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      const responseData = await response.json();
      setGmailResponses(prev => ({
        ...prev,
        [influencer.id]: {
          status: 'success',
          timestamp: new Date().toISOString(),
          response: responseData
        }
      }));

      toast({
        title: "Email Sent Successfully",
        description: `Gmail workflow completed for ${influencer.name}.`,
      });

    } catch (error) {
      console.error('Error sending Gmail workflow:', error);
      setGmailResponses(prev => ({
        ...prev,
        [influencer.id]: {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
      toast({
        title: "Failed to Send Email",
        description: "Unable to send Gmail workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGmailInProgress(prev => ({ ...prev, [influencer.id]: false }));
      setSelectedInfluencerForGmail(null);
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
                                  onClick={() => handleEmailClick(influencer)}
                                  disabled={isGmailInProgress[influencer.id]}
                                  className="text-gray-600 hover:text-coral hover:bg-coral/10"
                                >
                                  {isGmailInProgress[influencer.id] ? (
                                    <span className="loading loading-spinner loading-xs" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
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

      {/* Campaign Selection Modal for Gmail */}
      <Dialog open={isGmailModalOpen} onOpenChange={setIsGmailModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle>Select Campaign for {selectedInfluencerForGmail?.name}</DialogTitle>
            <DialogDescription>
              Choose a campaign to send Gmail workflow for this influencer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Choose a campaign to send Gmail workflow for:</p>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {campaigns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active campaigns found</p>
              ) : (
                campaigns.map((campaign) => (
                  <Button
                    key={campaign.id}
                    variant="outline"
                    onClick={() => handleGmailSend(campaign.id)}
                    disabled={isGmailInProgress[selectedInfluencerForGmail?.id || '']}
                    className="justify-start border-gray-200 text-gray-900 hover:bg-gray-50"
                  >
                    <div className="text-left">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.brand}</div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}