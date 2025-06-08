import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Phone, Mail, MessageSquare, ChevronLeft } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  status: string;
  created_at: string;
  timeline?: string;
  budget?: number;
  deliverables?: string;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  phone_no?: string | null;
  gmail_gmail?: string | null;
  campaigns?: Campaign[];
  campaign_status?: string;
}

interface CampaignInfluencerResponse {
  id: string;
  status: string;
  campaign: {
    id: string;
    name: string;
    brand: string;
    status: string;
    created_at: string;
    timeline?: string;
    budget?: number;
    deliverables?: string;
  };
  influencer: {
    id: string;
    name: string;
    handle: string;
    avatar_url: string;
    platform: string;
    followers_count: number;
    engagement_rate: number;
    phone_no?: string | null;
    gmail_gmail?: string | null;
  };
}

export default function OutreachManager() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [selectedInfluencerForGmail, setSelectedInfluencerForGmail] = useState<Influencer | null>(null);
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});
  const [isGmailInProgress, setIsGmailInProgress] = useState<Record<string, boolean>>({});
  const [showChats, setShowChats] = useState(false);

  useEffect(() => {
    console.log('🔍 OutreachManager: Auth state:', { user: !!user, authLoading });
    if (!authLoading) {
      console.log('✅ OutreachManager: Fetching data...');
      fetchInfluencers();
      fetchCampaigns();
    }
  }, [user, authLoading]);



  const fetchCampaigns = async () => {
    try {
      console.log('🔍 OutreachManager: Fetching campaigns...');

      // Build query based on authentication status
      let query = supabase
        .from('campaigns')
        .select('id, name, brand, status, created_at, timeline, budget, deliverables')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // If user is authenticated, filter by user_id
      if (user) {
        console.log('🔐 OutreachManager: Filtering campaigns by user ID:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.log('🌐 OutreachManager: No user authentication, showing all active campaigns');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ OutreachManager: Error fetching campaigns:', error);
        throw error;
      }

      console.log('✅ OutreachManager: Campaigns fetched:', data?.length || 0);
      setCampaigns(data || []);
    } catch (error) {
      console.error('❌ OutreachManager: Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchInfluencers = async () => {
    try {
      console.log('🔍 OutreachManager: Fetching campaign influencers...');

      // Build query based on authentication status
      let query = supabase
        .from('campaign_influencers')
        .select(`
          id,
          status,
          campaign:campaigns!inner (
            id,
            name,
            brand,
            status,
            created_at,
            timeline,
            budget,
            deliverables,
            user_id
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

      // If user is authenticated, filter by user_id
      if (user) {
        console.log('🔐 OutreachManager: Filtering by user ID:', user.id);
        query = query.eq('campaign.user_id', user.id);
      } else {
        console.log('🌐 OutreachManager: No user authentication, showing all active campaigns');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ OutreachManager: Error fetching campaign influencers:', error);
        throw error;
      }
      console.log('✅ OutreachManager: Campaign influencers fetched:', data?.length || 0);

      // Transform the data to match the Influencer interface
      const influencersData: Influencer[] = (data as unknown as Array<{
        id: string;
        status: string;
        campaign: Campaign;
        influencer: {
          id: string;
          name: string;
          handle: string;
          avatar_url: string;
          platform: string;
          followers_count: number;
          engagement_rate: number;
          phone_no?: string | null;
          gmail_gmail?: string | null;
        };
      }>)?.map(ci => ({
        id: ci.influencer.id,
        name: ci.influencer.name,
        handle: ci.influencer.handle,
        avatar_url: ci.influencer.avatar_url,
        platform: ci.influencer.platform,
        followers_count: ci.influencer.followers_count,
        engagement_rate: ci.influencer.engagement_rate,
        phone_no: ci.influencer.phone_no,
        gmail_gmail: ci.influencer.gmail_gmail,
        campaigns: [ci.campaign],
        campaign_status: ci.status
      })) || [];

      setInfluencers(influencersData);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      toast({
        title: "Error",
        description: "Failed to load influencers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      // Prepare the request body
      const requestBody = {
        competitionData: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          competitorBrands: [
            {
              brandName: campaign.brand,
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
            [influencer.platform]: influencer.handle
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
          deliverables: campaign.deliverables ? campaign.deliverables.split(',').map((item) => ({
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
            totalFee: 15000,
            currency: "INR",
            paymentSchedule: [
              {
                milestone: "After Content Delivery",
                amount: 15000,
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
    }
  };



  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    influencer.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-gray-900">Outreach Manager</CardTitle>
          <p className="text-sm text-gray-600">Manage your influencer outreach for active campaigns</p>
        </div>
        <Button
          variant="outline"
          className="ml-auto flex items-center gap-2 border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300"
          onClick={() => setShowChats((prev) => !prev)}
        >
          <MessageSquare className="h-4 w-4" />
          {showChats ? 'Back to Outreach' : 'Show Chats'}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {showChats ? (
            <div className="p-4">
              <ChatInterface
                userId={user?.id}
                className="h-[600px]"
              />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 px-4">
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
                <div className="px-4">
                  {filteredInfluencers.map((influencer) => (
                    <div
                      key={influencer.id}
                      className="grid grid-cols-[1fr_1fr_100px_100px_100px_120px] gap-4 py-3 border-b border-gray-200 items-center"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={influencer.avatar_url} />
                          <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{influencer.name}</p>
                          <p className="text-sm text-gray-600">@{influencer.handle}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{influencer.platform}</p>
                        <p className="text-sm text-gray-600">{influencer.campaigns?.[0]?.name || 'No active campaign'}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        {influencer.campaign_status || 'N/A'}
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
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
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
                    className="justify-start border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300"
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