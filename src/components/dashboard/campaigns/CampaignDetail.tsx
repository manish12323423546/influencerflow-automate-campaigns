import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Edit, Users, BarChart3, FileText, MessageSquare,
  Plus, Phone, Mail, Calendar, DollarSign, Target,
  CheckCircle2, AlertCircle, Clock, Share2, Download, Save, Eye, XCircle, Trash2, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateElevenLabsEnvVars } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { recalculateCampaignStatistics } from '@/lib/utils/campaignStatistics';

interface Campaign {
  id: string;
  name: string;
  description: string;
  brand: string;
  status: 'active' | 'completed' | 'draft' | 'paused';
  budget: number;
  spent: number;
  reach: number;
  engagement_rate: number;
  timeline: string | null;
  goals: string;
  target_audience: string;
  deliverables: string;
  created_at: string;
  campaign_influencers?: Array<{
    id: string;
    fee: number;
    status: string;
    match_score: number;
    match_reason: string;
    influencer: {
      id: string;
      handle: string;
      name: string;
      avatar_url: string;
      platform: string;
      followers_count: number;
      engagement_rate: number;
      phone_no?: string | null;
      gmail_gmail?: string | null;
    };
  }>;
}

interface CampaignInfluencer {
  id: string;
  campaign_id: string;
  influencer_id: string;
  status: 'shortlisted' | 'invited' | 'confirmed' | 'declined' | 'completed';
  fee: number;
  match_score: number;
  match_reason: string;
}

interface Contract {
  id: string;
  influencerId: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  amount: number;
  deliverables: string[];
  signedDate?: string;
}

interface PerformanceMetric {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface AddInfluencerDialogProps {
  campaignId: string;
  onInfluencerAdded: () => void;
  fetchCampaignDetails: () => Promise<void>;
}

interface InfluencerProfile {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  phone_no?: string | null;
  gmail_gmail?: string | null;
}

const AddInfluencerDialog = ({ campaignId, onInfluencerAdded, fetchCampaignDetails }: AddInfluencerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchInfluencers = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('influencers')
          .select('*')
          .order('followers_count', { ascending: false });

        if (searchTerm.trim()) {
          query = query.or(`name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Error fetching influencers:', error);
          return;
        }

        setInfluencers((data || []).map(inf => ({
          id: inf.id,
          name: inf.name,
          handle: inf.handle,
          avatar_url: inf.avatar_url,
          platform: inf.platform,
          followers_count: inf.followers_count,
          engagement_rate: inf.engagement_rate,
          phone_no: inf.phone_no?.toString(),
          gmail_gmail: inf.gmail_gmail
        })));
      } catch (error) {
        logger.error('Error fetching influencers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchInfluencers();
    }
  }, [open, searchTerm]);

  const handleAddInfluencer = async (influencerId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaign_influencers')
        .insert({
          campaign_id: campaignId,
          influencer_id: influencerId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Influencer added",
        description: "The influencer has been added to the campaign successfully.",
      });

      // Manually recalculate statistics and refresh campaign data
      await recalculateCampaignStatistics(campaignId);
      await fetchCampaignDetails();
      onInfluencerAdded();
      setOpen(false);
    } catch (error) {
      logger.error('Error adding influencer:', error);
      toast({
        title: "Error",
        description: "Failed to add influencer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-coral hover:bg-coral/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Influencer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900 border-gray-200">
        <DialogHeader>
          <DialogTitle>Add Influencer to Campaign</DialogTitle>
          <DialogDescription>
            Search and select an influencer to add to this campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="search">Search Influencers</label>
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search influencers..."
              className="bg-white border-gray-200"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Trigger search on Enter key
                }
              }}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral mx-auto mb-2"></div>
                Loading influencers...
              </div>
            ) : influencers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No influencers found. Try a different search term.
              </div>
            ) : (
              influencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100 mb-2"
                  onClick={() => handleAddInfluencer(influencer.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={influencer.avatar_url} />
                      <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{influencer.name}</p>
                      <p className="text-sm text-gray-600">@{influencer.handle}</p>
                      <p className="text-xs text-gray-500">
                        {influencer.platform} • {influencer.followers_count.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-coral hover:bg-coral/10"
                    disabled={loading}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface InfluencerProfileDialogProps {
  influencer: any;
  onClose: () => void;
  open: boolean;
}

const InfluencerProfileDialog = ({ influencer, onClose, open }: InfluencerProfileDialogProps) => {
  if (!influencer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white text-gray-900 border-gray-200">
        <DialogHeader>
          <DialogTitle>Influencer Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={influencer.avatar_url} />
              <AvatarFallback>{influencer.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{influencer.name}</h3>
              <p className="text-gray-600">@{influencer.handle}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Platform</p>
              <p className="font-medium">{influencer.platform}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Followers</p>
              <p className="font-medium">{influencer.followers_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Engagement Rate</p>
              <p className="font-medium">{influencer.engagement_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-medium">{influencer.industry}</p>
            </div>
          </div>
          {(influencer.phone_no || influencer.gmail_gmail) && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium mb-2">Contact Information</h4>
              {influencer.phone_no && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{influencer.phone_no}</span>
                </div>
              )}
              {influencer.gmail_gmail && (
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <Mail className="h-4 w-4" />
                  <span>{influencer.gmail_gmail}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ACTIVE_CONTRACT_STATUSES = ['SENT', 'ACCEPTED', 'COMPLETED'];

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(location.state?.isEditing || false);
  const [editedCampaign, setEditedCampaign] = useState<Partial<Campaign>>({});
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const [removingInfluencerId, setRemovingInfluencerId] = useState<string | null>(null);
  const [isCallInProgress, setIsCallInProgress] = useState<Record<string, boolean>>({});
  const [gmailResponses, setGmailResponses] = useState<Record<string, {
    status: 'sending' | 'success' | 'error';
    timestamp?: string;
    response?: unknown;
    error?: string;
  }>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  const handlePhoneCall = async (influencerId: string, influencerName: string, phoneNumber: string | null) => {
    logger.info('📞 Call Button Clicked:', {
      influencerId,
      influencerName,
      phoneNumber,
      timestamp: new Date().toISOString()
    });

    if (!phoneNumber) {
      logger.warn('❌ Phone call failed: No phone number available', {
        influencerId,
        influencerName
      });
      toast({
        title: "Phone number not available",
        description: `No phone number found for ${influencerName}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const env = validateElevenLabsEnvVars();
      
      logger.info('🔄 Setting call in progress state for influencer:', influencerId);
      setIsCallInProgress(prev => {
        logger.info('Previous call states:', prev);
        return { ...prev, [influencerId]: true };
      });

      logger.info('📤 Preparing API request to Eleven Labs:', {
        url: "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
        method: "POST",
        influencerName,
        phoneNumber: `+${phoneNumber}`,
        agentId: env.VITE_ELEVENLABS_AGENT_ID,
        phoneNumberId: env.VITE_ELEVENLABS_PHONE_NUMBER_ID,
        hasApiKey: !!env.VITE_ELEVENLABS_API_KEY
      });

      toast({
        title: "Initiating call",
        description: `Starting a call with ${influencerName}...`,
      });

      const requestBody = {
        agent_id: env.VITE_ELEVENLABS_AGENT_ID,
        agent_phone_number_id: env.VITE_ELEVENLABS_PHONE_NUMBER_ID,
        to_number: `+${phoneNumber}`
      };

      logger.info('📦 Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": env.VITE_ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      logger.info('📥 API Response Status:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseData = await response.json();
      logger.info('📥 API Response Body:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        logger.info('✅ Call initiated successfully:', {
          influencerId,
          influencerName,
          responseData
        });
        toast({
          title: "Call initiated",
          description: `Connected with ${influencerName}`,
        });
      } else {
        logger.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseData
        });
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      logger.error('❌ Error in handlePhoneCall:', {
        error: error instanceof Error ? error.message : String(error),
        influencerId,
        influencerName,
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Call failed",
        description: "Unable to initiate the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      logger.info('🔄 Resetting call in progress state for influencer:', influencerId);
      setIsCallInProgress(prev => {
        logger.info('Final call states:', prev);
        return { ...prev, [influencerId]: false };
      });
    }
  };

  const handleGmail = async (influencerId: string, influencerName: string, gmailAddress: string | null) => {
    if (!gmailAddress) {
      toast({
        title: "Gmail not available",
        description: `No Gmail address found for ${influencerName}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setGmailResponses(prev => ({ ...prev, [influencerId]: { status: 'sending' } }));

      toast({
        title: "Sending...",
        description: `Sending Gmail workflow for ${influencerName}...`,
      });

      // Get the influencer data from the campaign
      const campaignInfluencer = campaign?.campaign_influencers?.find(
        ci => ci.influencer.id === influencerId
      );

      if (!campaignInfluencer) {
        throw new Error('Influencer data not found');
      }

      const influencerData = campaignInfluencer.influencer;

      // Get contract data from Supabase if available
      const { data: contractData } = await supabase
        .from('contracts')
        .select('*')
        .eq('influencer_id', influencerId)
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

      const timelineDates = parseTimelineDate(campaign?.timeline);
      const defaultStartDate = new Date().toISOString().slice(0, 10);
      const defaultEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const startDate = timelineDates?.[0] || defaultStartDate;
      const endDate = timelineDates?.[1] || defaultEndDate;

      // Prepare the request body in the exact format you specified
      const requestBody = {
        competitionData: {
          campaignId: campaign?.id || `cmp_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${campaign?.name?.replace(/\s+/g, '').slice(0, 3).toUpperCase()}`,
          campaignName: campaign?.name || "Campaign",
          competitorBrands: [
            {
              brandName: campaign?.brand || "Brand",
              campaignBudget: campaign?.budget || 0,
              startDate: startDate,
              endDate: endDate
            }
          ]
        },
        influencerDetail: {
          influencerId: influencerId,
          name: influencerName,
          gmail: gmailAddress,
          socialHandles: {
            [influencerData.platform]: influencerData.handle || `@${influencerName.toLowerCase().replace(/\s+/g, '')}`
          },
          followers: {
            [influencerData.platform]: influencerData.followers_count
          },
          engagementRate: influencerData.engagement_rate,
          category: influencerData.platform === 'instagram' ? 'Social Media' :
                   influencerData.platform === 'youtube' ? 'Video Content' :
                   influencerData.platform === 'tiktok' ? 'Short Form Video' : 'Content Creation'
        },
        contract: {
          contractId: contractData?.id || `ctr_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${influencerId.slice(0, 3).toUpperCase()}`,
          contractType: "Fixed-Fee",
          startDate: startDate,
          endDate: endDate,
          deliverables: campaign?.deliverables ? campaign.deliverables.split(',').map((item, index) => ({
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
            totalFee: campaignInfluencer.fee || 15000,
            currency: "INR",
            paymentSchedule: [
              {
                milestone: "After Content Delivery",
                amount: campaignInfluencer.fee || 15000,
                dueOn: endDate
              }
            ]
          },
          terminationClause: "Either party may terminate with 7 days' notice; refund or prorated payment applies if terminated early.",
          exclusivity: {
            applicable: true,
            category: influencerData.platform === 'instagram' ? 'Social Media' :
                     influencerData.platform === 'youtube' ? 'Video Content' :
                     influencerData.platform === 'tiktok' ? 'Short Form Video' : 'Content Creation',
            duration: `${startDate} to ${endDate}`
          }
        }
      };

      logger.info('Sending Gmail workflow with data:', JSON.stringify(requestBody, null, 2));

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
        [influencerId]: {
          status: 'success',
          timestamp: new Date().toISOString(),
          response: responseData
        }
      }));

      toast({
        title: "Email Sent Successfully",
        description: `Gmail workflow completed for ${influencerName}.`,
      });

    } catch (error) {
      logger.error('Error sending Gmail workflow:', error);
      setGmailResponses(prev => ({
        ...prev,
        [influencerId]: {
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
    }
  };

  useEffect(() => {
    fetchCampaignDetails();
  }, [id, navigate, toast]);

  const fetchCampaignDetails = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_influencers (
            id,
            fee,
            status,
            match_score,
            match_reason,
            influencer:influencers (
              id,
              handle,
              name,
              avatar_url,
              platform,
              followers_count,
              engagement_rate,
              phone_no,
              gmail_gmail
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Campaign not found",
          description: "The requested campaign could not be found.",
          variant: "destructive",
        });
        navigate('/campaigns');
        return;
      }

      const campaignData = {
        ...data,
        spent: data.campaign_influencers?.reduce((total, ci) => total + (ci.fee || 0), 0) || 0,
        reach: data.campaign_influencers?.reduce((total, ci) => 
          total + (ci.influencer?.followers_count || 0), 0) || 0,
        engagement_rate: data.campaign_influencers?.reduce((total, ci) => 
          total + (ci.influencer?.engagement_rate || 0), 0) / 
          (data.campaign_influencers?.length || 1) || 0
      };

      setCampaign(campaignData as unknown as Campaign);
    } catch (error) {
      logger.error('Error fetching campaign details:', error);
      toast({
        title: "Error loading campaign",
        description: "There was a problem loading the campaign details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Update isEditing when location state changes
    setIsEditing(location.state?.isEditing || false);
    // Initialize editedCampaign when isEditing is true
    if (location.state?.isEditing && campaign) {
      setEditedCampaign({
        name: campaign.name,
        description: campaign.description,
        goals: campaign.goals,
        target_audience: campaign.target_audience,
        deliverables: campaign.deliverables,
        timeline: campaign.timeline,
        budget: campaign.budget,
        status: campaign.status
      });
    }
  }, [location.state, campaign]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveChanges();
    }
    setIsEditing(!isEditing);
    if (!isEditing && campaign) {
      setEditedCampaign({
        name: campaign.name,
        description: campaign.description,
        goals: campaign.goals,
        target_audience: campaign.target_audience,
        deliverables: campaign.deliverables,
        timeline: campaign.timeline,
        budget: campaign.budget
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!campaign || !editedCampaign) return;

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({
          name: editedCampaign.name,
          description: editedCampaign.description,
          goals: editedCampaign.goals,
          target_audience: editedCampaign.target_audience,
          deliverables: editedCampaign.deliverables,
          timeline: editedCampaign.timeline,
          budget: editedCampaign.budget,
          status: editedCampaign.status || campaign.status
        })
        .eq('id', campaign.id);

      if (error) throw error;

      setCampaign(prev => prev ? { ...prev, ...editedCampaign } : null);
      setIsEditing(false);
      // Clear the location state to remove isEditing flag
      navigate(`/campaigns/${campaign.id}`, { replace: true });
      toast({
        title: "Changes saved",
        description: "Campaign details have been updated successfully.",
      });
    } catch (error) {
      logger.error('Error saving campaign:', error);
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof Campaign, value: string | number) => {
    setEditedCampaign(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'paused':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const calculateProgress = () => {
    if (!campaign?.campaign_influencers?.length) return 0;
    const total = campaign.campaign_influencers.length;
    const completed = campaign.campaign_influencers.filter(ci => 
      ci.status === 'completed' || ci.status === 'confirmed'
    ).length;
    return Math.round((completed / total) * 100);
  };

  const handleMessageClick = (influencer: any) => {
    const createOrGetConversation = async () => {
      try {
        const { data: existingConv, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .eq('influencer_id', influencer.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingConv) {
          navigate('/outreach', { state: { selectedConversationId: existingConv.id } });
          return;
        }

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

        navigate('/outreach', { state: { selectedConversationId: newConv.id } });
      } catch (error) {
        logger.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
      }
    };

    createOrGetConversation();
  };

  const handleRemoveInfluencer = async (campaignInfluencerId: string) => {
    try {
      setRemovingInfluencerId(campaignInfluencerId);

      const { error } = await supabase
        .from('campaign_influencers')
        .delete()
        .eq('id', campaignInfluencerId);

      if (error) throw error;

      // Manually recalculate statistics and refresh campaign data
      await recalculateCampaignStatistics(campaign.id);
      await fetchCampaignDetails();

      toast({
        title: "Influencer removed",
        description: "The influencer has been removed from the campaign.",
      });
    } catch (error) {
      logger.error('Error removing influencer:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingInfluencerId(null);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;

    // Validate confirmation text
    if (deleteConfirmText !== campaign.name) {
      toast({
        title: "Confirmation required",
        description: "Please type the campaign name exactly to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      logger.info('Starting campaign deletion process for campaign:', campaign.id);

      // Delete related data in the correct order to avoid foreign key constraints

      // 1. Delete posts first (no dependencies)
      const { error: postsError } = await supabase
        .from('posts')
        .delete()
        .eq('campaign_id', campaign.id);

      if (postsError) {
        logger.error('Error deleting posts:', postsError);
        // Don't throw here as posts might not exist
      }

      // 2. Delete performance reports
      const { error: performanceReportsError } = await supabase
        .from('performance_reports')
        .delete()
        .eq('campaign_id', campaign.id);

      if (performanceReportsError) {
        logger.error('Error deleting performance reports:', performanceReportsError);
        // Don't throw here as reports might not exist
      }

      // 3. Delete contracts
      const { error: contractsError } = await supabase
        .from('contracts')
        .delete()
        .eq('campaign_id', campaign.id);

      if (contractsError) {
        logger.error('Error deleting contracts:', contractsError);
        throw new Error(`Failed to delete contracts: ${contractsError.message}`);
      }

      // 4. Delete campaign automation logs
      const { error: logsError } = await supabase
        .from('campaign_automation_logs')
        .delete()
        .eq('campaign_id', campaign.id);

      if (logsError) {
        logger.error('Error deleting automation logs:', logsError);
        // Don't throw here as logs might not exist
      }

      // 5. Delete campaign metrics
      const { error: metricsError } = await supabase
        .from('campaign_metrics')
        .delete()
        .eq('campaign_id', campaign.id);

      if (metricsError) {
        logger.error('Error deleting campaign metrics:', metricsError);
        // Don't throw here as metrics might not exist
      }

      // 6. Delete report metrics that reference this campaign
      const { error: reportMetricsError } = await supabase
        .from('report_metrics')
        .delete()
        .eq('campaign_id', campaign.id);

      if (reportMetricsError) {
        logger.error('Error deleting report metrics:', reportMetricsError);
        // Don't throw here as report metrics might not exist
      }

      // 7. Update reports to remove this campaign from campaign_ids arrays
      const { data: reportsWithCampaign, error: reportsSelectError } = await supabase
        .from('reports')
        .select('id, campaign_ids')
        .contains('campaign_ids', [campaign.id]);

      if (!reportsSelectError && reportsWithCampaign) {
        for (const report of reportsWithCampaign) {
          const updatedCampaignIds = report.campaign_ids.filter((id: string) => id !== campaign.id);

          if (updatedCampaignIds.length === 0) {
            // If no campaigns left, delete the report
            await supabase.from('reports').delete().eq('id', report.id);
          } else {
            // Update the report with remaining campaign IDs
            await supabase
              .from('reports')
              .update({ campaign_ids: updatedCampaignIds })
              .eq('id', report.id);
          }
        }
      }

      // 8. Delete campaign influencers
      const { error: influencersError } = await supabase
        .from('campaign_influencers')
        .delete()
        .eq('campaign_id', campaign.id);

      if (influencersError) {
        logger.error('Error deleting campaign influencers:', influencersError);
        throw new Error(`Failed to delete campaign influencers: ${influencersError.message}`);
      }

      // 5. Finally delete the campaign itself
      const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);

      if (campaignError) {
        logger.error('Error deleting campaign:', campaignError);
        throw new Error(`Failed to delete campaign: ${campaignError.message}`);
      }

      logger.info('Campaign deletion completed successfully');

      toast({
        title: "Campaign deleted",
        description: "The campaign and all related data have been successfully deleted.",
      });

      // Navigate back to campaigns list
      navigate('/dashboard');

    } catch (error) {
      logger.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const widget = document.querySelector('elevenlabs-convai');
    
    const handleReady = () => {
      logger.info('Widget is ready');
    };

    const handleCall = (event: CustomEvent) => {
      logger.info('Starting conversation');
      if (event.detail?.config) {
        event.detail.config.clientTools = {
          testConversation: ({ message }: { message: string }) => {
            logger.info('Test conversation message:', message);
            return { success: true };
          }
        };
      }
    };

    const handleEnd = () => {
      logger.info('Conversation ended');
    };

    if (widget) {
      widget.addEventListener('elevenlabs-convai:ready', handleReady);
      widget.addEventListener('elevenlabs-convai:call', handleCall as EventListener);
      widget.addEventListener('elevenlabs-convai:end', handleEnd);
    }

    return () => {
      if (widget) {
        widget.removeEventListener('elevenlabs-convai:ready', handleReady);
        widget.removeEventListener('elevenlabs-convai:call', handleCall as EventListener);
        widget.removeEventListener('elevenlabs-convai:end', handleEnd);
      }
    };
  }, []);

  // Fetch active contracts for this campaign
  useEffect(() => {
    const fetchActiveContracts = async () => {
      if (!campaign?.id) return;
      setContractsLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select(`id, influencer_id, status, contract_data, pdf_url, influencer:influencers(id, name, handle, platform, avatar_url)`)
        .eq('campaign_id', campaign.id)
        .in('status', ACTIVE_CONTRACT_STATUSES)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setActiveContracts(data);
      } else {
        setActiveContracts([]);
      }
      setContractsLoading(false);
    };
    fetchActiveContracts();
  }, [campaign?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Not Found</h2>
        <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-coral hover:bg-coral/10"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              {isEditing ? (
                <Input
                  value={editedCampaign.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-white border-gray-200"
                  placeholder="Campaign Name"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              )}
              <p className="text-gray-600">{campaign.brand}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Select
                value={editedCampaign.status || campaign.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-900 shadow-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
            )}
            <Button
              onClick={handleEditToggle}
              className={isEditing ? "bg-green-500 hover:bg-green-600 text-white" : "bg-coral hover:bg-coral/90 text-white"}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </>
              )}
            </Button>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Delete Campaign</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the campaign and all related data including contracts, metrics, and automation logs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="confirm-text" className="text-sm font-medium text-gray-700">
                      Type <span className="font-bold text-red-600">{campaign.name}</span> to confirm:
                    </label>
                    <Input
                      id="confirm-text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Enter campaign name"
                      className="bg-white border-gray-200"
                      disabled={isDeleting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleDeleteCampaign}
                    disabled={isDeleting || deleteConfirmText !== campaign.name}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete Campaign'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedCampaign.budget || ''}
                      onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
                      className="text-2xl font-bold text-gray-900 bg-white border-gray-200"
                      placeholder="Enter budget"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">${campaign.budget?.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Spent: ${campaign.spent?.toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Timeline</p>
                  {isEditing ? (
                    <Input
                      value={editedCampaign.timeline || ''}
                      onChange={(e) => handleInputChange('timeline', e.target.value)}
                      className="text-sm text-gray-900 bg-white border-gray-200"
                      placeholder="e.g., 2025-01-01 to 2025-01-31"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {campaign.timeline || 'Not set'}
                    </p>
                  )}
                </div>
                <Calendar className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reach</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaign.reach?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {campaign.engagement_rate}% engagement
                  </p>
                </div>
                <Share2 className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateProgress()}%</p>
                  <Progress value={calculateProgress()} className="mt-2" />
                </div>
                <CheckCircle2 className="h-8 w-8 text-coral" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Description</h3>
                {isEditing ? (
                  <Input
                    value={editedCampaign.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="text-gray-900 bg-white border-gray-200"
                    placeholder="Campaign description"
                  />
                ) : (
                  <p className="text-gray-900">{campaign.description}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Goals</h3>
                {isEditing ? (
                  <Input
                    value={editedCampaign.goals || ''}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    className="text-gray-900 bg-white border-gray-200"
                    placeholder="Campaign goals"
                  />
                ) : (
                  <p className="text-gray-900">{campaign.goals}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Target Audience</h3>
                {isEditing ? (
                  <Input
                    value={editedCampaign.target_audience || ''}
                    onChange={(e) => handleInputChange('target_audience', e.target.value)}
                    className="text-gray-900 bg-white border-gray-200"
                    placeholder="Target audience"
                  />
                ) : (
                  <p className="text-gray-900">{campaign.target_audience}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Deliverables</h3>
                {isEditing ? (
                  <Input
                    value={editedCampaign.deliverables || ''}
                    onChange={(e) => handleInputChange('deliverables', e.target.value)}
                    className="text-gray-900 bg-white border-gray-200"
                    placeholder="Campaign deliverables"
                  />
                ) : (
                  <p className="text-gray-900">{campaign.deliverables}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Timeline</h3>
                {isEditing ? (
                  <Input
                    value={editedCampaign.timeline || ''}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="text-gray-900 bg-white border-gray-200"
                    placeholder="e.g., 2025-01-01 to 2025-01-31"
                  />
                ) : (
                  <p className="text-gray-900">{campaign.timeline || 'Not set'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Campaign Influencers</CardTitle>
              <AddInfluencerDialog
                campaignId={campaign.id}
                onInfluencerAdded={() => {
                  window.location.reload();
                }}
                fetchCampaignDetails={fetchCampaignDetails}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Influencer</TableHead>
                    <TableHead className="text-gray-600">Platform</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Followers</TableHead>
                    <TableHead className="text-gray-600">Engagement</TableHead>
                    <TableHead className="text-gray-600">Contact</TableHead>
                    {isEditing && <TableHead className="text-gray-600">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.campaign_influencers?.map((ci) => (
                    <TableRow key={ci.id} className="border-gray-200">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={ci.influencer.avatar_url} />
                            <AvatarFallback>{ci.influencer.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-gray-900 font-medium">{ci.influencer.name}</p>
                            <p className="text-gray-600 text-sm">{ci.influencer.handle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{ci.influencer.platform}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ci.status)}>
                          {ci.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {ci.influencer.followers_count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {ci.influencer.engagement_rate}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ci.influencer.phone_no && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`text-gray-600 hover:text-green-500 hover:bg-green-50 ${
                                isCallInProgress[ci.influencer.id] ? 'bg-green-500/10' : ''
                              }`}
                              onClick={() => handlePhoneCall(ci.influencer.id, ci.influencer.name, ci.influencer.phone_no)}
                              disabled={isCallInProgress[ci.influencer.id]}
                            >
                              {isCallInProgress[ci.influencer.id] ? (
                                <span className="loading loading-spinner loading-xs" />
                              ) : (
                                <Phone className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {ci.influencer.gmail_gmail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-coral hover:bg-coral/10"
                              onClick={() => handleGmail(ci.influencer.id, ci.influencer.name, ci.influencer.gmail_gmail)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      {isEditing && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleRemoveInfluencer(ci.id)}
                            disabled={removingInfluencerId === ci.id}
                          >
                            {removingInfluencerId === ci.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <InfluencerProfileDialog
            influencer={selectedInfluencer}
            open={!!selectedInfluencer}
            onClose={() => setSelectedInfluencer(null)}
          />

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Active Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              {contractsLoading ? (
                <div className="text-center py-12">Loading contracts...</div>
              ) : activeContracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Influencer</TableHead>
                      <TableHead className="text-gray-600">Status</TableHead>
                      <TableHead className="text-gray-600">Fee</TableHead>
                      <TableHead className="text-gray-600">Deliverables</TableHead>
                      <TableHead className="text-gray-600">Timeline</TableHead>
                      <TableHead className="text-gray-600">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeContracts.map((contract) => {
                      const contractData = typeof contract.contract_data === 'string'
                        ? JSON.parse(contract.contract_data)
                        : contract.contract_data || {};
                      return (
                        <TableRow key={contract.id} className="border-gray-200">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={contract.influencer?.avatar_url} />
                                <AvatarFallback>{contract.influencer?.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{contract.influencer?.name}</p>
                                <p className="text-sm text-gray-600">@{contract.influencer?.handle}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-900">
                            ${contractData.fee?.toLocaleString?.() || contractData.fee || 0}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {contractData.deliverables
                              ? Array.isArray(contractData.deliverables)
                                ? contractData.deliverables.map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm">{item.type || item}</div>
                                  ))
                                : contractData.deliverables
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {contractData.deadline || contractData.endDate || 'Not set'}
                          </TableCell>
                          <TableCell>
                            {contract.pdf_url ? (
                              <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" className="text-coral underline">PDF</a>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contracts</h3>
                  <p className="text-gray-600">
                    There are no active contracts in this campaign yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Section */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payments & Reports
              </CardTitle>
              {campaign.status === 'active' && (
                <Button
                  onClick={() => {
                    // Navigate to reports tab in dashboard with campaign pre-selected
                    navigate('/dashboard?tab=reports&campaign=' + campaign.id);
                  }}
                  className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Budget</p>
                        <p className="text-xl font-bold text-gray-900">₹{campaign.budget?.toLocaleString() || 0}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-coral" />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Amount Spent</p>
                        <p className="text-xl font-bold text-gray-900">₹{campaign.spent?.toLocaleString() || 0}</p>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Remaining</p>
                        <p className="text-xl font-bold text-gray-900">
                          ₹{((campaign.budget || 0) - (campaign.spent || 0)).toLocaleString()}
                        </p>
                      </div>
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Payment Status by Influencer</h3>
                  {campaign.campaign_influencers && campaign.campaign_influencers.length > 0 ? (
                    <div className="space-y-3">
                      {campaign.campaign_influencers.map((ci) => (
                        <div key={ci.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={ci.influencer.avatar_url} />
                              <AvatarFallback>{ci.influencer.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{ci.influencer.name}</p>
                              <p className="text-sm text-gray-600">@{ci.influencer.handle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-medium text-gray-900">₹{ci.fee?.toLocaleString() || 0}</p>
                              <Badge className={
                                ci.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                ci.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              }>
                                {ci.status === 'completed' ? 'Paid' :
                                 ci.status === 'confirmed' ? 'Pending' : 'Not Started'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Influencers Added</h3>
                      <p className="text-gray-600">Add influencers to this campaign to track payments.</p>
                    </div>
                  )}
                </div>

                {/* Report Generation Info */}
                {campaign.status === 'active' && (
                  <div className="bg-coral/5 border border-coral/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="h-5 w-5 text-coral mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Generate Performance Report</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Create detailed reports for this active campaign including payment status,
                          influencer performance, and ROI analysis.
                        </p>
                        <Button
                          onClick={() => {
                            navigate('/dashboard?tab=reports&campaign=' + campaign.id);
                          }}
                          size="sm"
                          className="bg-coral hover:bg-coral/90 text-white"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
