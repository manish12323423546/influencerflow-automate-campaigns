import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Edit, Users, BarChart3, FileText, MessageSquare, 
  Plus, Phone, Mail, Calendar, DollarSign, Target, 
  CheckCircle2, AlertCircle, Clock, Share2, Download, Save, Eye, XCircle 
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
  start_date: string;
  end_date: string;
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
  name: string;
  handle: string;
  avatar_url: string;
  status: 'shortlisted' | 'invited' | 'confirmed' | 'declined' | 'completed';
  followers_count: number;
  engagement_rate: number;
  fee: number;
  phone_no?: number | null;
  gmail_gmail?: string | null;
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
}

const AddInfluencerDialog = ({ campaignId, onInfluencerAdded }: AddInfluencerDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchInfluencers = async () => {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .ilike('name', `%${searchTerm}%`);
      
      if (error) {
        console.error('Error fetching influencers:', error);
        return;
      }

      setInfluencers(data || []);
    };

    if (open && searchTerm.length > 2) {
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
      
      onInfluencerAdded();
      setOpen(false);
    } catch (error) {
      console.error('Error adding influencer:', error);
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
        <Button className="bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Influencer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-snow">
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
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-lg cursor-pointer"
                onClick={() => handleAddInfluencer(influencer.id)}
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={influencer.avatar_url} />
                    <AvatarFallback>{influencer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{influencer.name}</p>
                    <p className="text-sm text-snow/60">@{influencer.handle}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-500"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
            ))}
            {searchTerm.length > 2 && influencers.length === 0 && (
              <p className="text-center text-snow/60 py-4">No influencers found</p>
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
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 text-snow">
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
              <p className="text-snow/60">@{influencer.handle}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-snow/70">Platform</p>
              <p className="font-medium">{influencer.platform}</p>
            </div>
            <div>
              <p className="text-sm text-snow/70">Followers</p>
              <p className="font-medium">{influencer.followers_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-snow/70">Engagement Rate</p>
              <p className="font-medium">{influencer.engagement_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-snow/70">Industry</p>
              <p className="font-medium">{influencer.industry}</p>
            </div>
          </div>
          {(influencer.phone_no || influencer.gmail_gmail) && (
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-sm font-medium mb-2">Contact Information</h4>
              {influencer.phone_no && (
                <div className="flex items-center gap-2 text-snow/70">
                  <Phone className="h-4 w-4" />
                  <span>{influencer.phone_no}</span>
                </div>
              )}
              {influencer.gmail_gmail && (
                <div className="flex items-center gap-2 text-snow/70 mt-1">
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

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCampaign, setEditedCampaign] = useState<Partial<Campaign>>({});
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [removingInfluencerId, setRemovingInfluencerId] = useState<string | null>(null);
  const [isCallInProgress, setIsCallInProgress] = useState<Record<string, boolean>>({});
  const [gmailResponses, setGmailResponses] = useState<Record<string, any>>({});

  const validateEnvVariables = () => {
    const requiredVars = {
      VITE_ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY,
      VITE_ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
      VITE_ELEVENLABS_PHONE_NUMBER_ID: import.meta.env.VITE_ELEVENLABS_PHONE_NUMBER_ID
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    return requiredVars;
  };

  const handlePhoneCall = async (influencerId: string, influencerName: string, phoneNumber: string | null) => {
    console.log('📞 Call Button Clicked:', {
      influencerId,
      influencerName,
      phoneNumber,
      timestamp: new Date().toISOString()
    });

    if (!phoneNumber) {
      console.warn('❌ Phone call failed: No phone number available', {
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
      const env = validateEnvVariables();
      
      console.log('🔄 Setting call in progress state for influencer:', influencerId);
      setIsCallInProgress(prev => {
        console.log('Previous call states:', prev);
        return { ...prev, [influencerId]: true };
      });

      console.log('📤 Preparing API request to Eleven Labs:', {
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

      console.log('📦 Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: {
          "Xi-Api-Key": env.VITE_ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 API Response Status:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseData = await response.json();
      console.log('📥 API Response Body:', JSON.stringify(responseData, null, 2));

      if (response.ok) {
        console.log('✅ Call initiated successfully:', {
          influencerId,
          influencerName,
          responseData
        });
        toast({
          title: "Call initiated",
          description: `Connected with ${influencerName}`,
        });
      } else {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseData
        });
        throw new Error('Failed to initiate call');
      }
    } catch (error) {
      console.error('❌ Error in handlePhoneCall:', {
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
      console.log('🔄 Resetting call in progress state for influencer:', influencerId);
      setIsCallInProgress(prev => {
        console.log('Final call states:', prev);
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
      const influencerData = campaign?.campaign_influencers?.find(
        ci => ci.influencer.id === influencerId
      )?.influencer;

      if (!influencerData) {
        throw new Error('Influencer data not found');
      }

      // Prepare the request body with current campaign context
      const requestBody = {
        gmail: gmailAddress,
        campaign: {
          id: campaign?.id,
          name: campaign?.name,
          brand: campaign?.brand,
          description: campaign?.description,
          goals: campaign?.goals,
          deliverables: campaign?.deliverables,
          budget: campaign?.budget,
          start_date: campaign?.start_date,
          end_date: campaign?.end_date
        },
        creator: {
          id: influencerId,
          name: influencerName,
          platform: influencerData.platform,
          handle: influencerData.handle,
          metrics: {
            followers: influencerData.followers_count,
            engagement: influencerData.engagement_rate
          }
        }
      };

      console.log('Sending Gmail workflow with data:', JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://varhhh.app.n8n.cloud/webhook/08b089ba-1617-4d04-a5c7-f9b7d8ca57c4", {
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
      console.error('Error sending Gmail workflow:', error);
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
          engagement_rate: data.campaign_influencers?.reduce((total, ci, index) => 
            total + (ci.influencer?.engagement_rate || 0), 0) / 
            (data.campaign_influencers?.length || 1) || 0
        };

        setCampaign(campaignData);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        toast({
          title: "Error loading campaign",
          description: "There was a problem loading the campaign details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id, navigate, toast]);

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
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        budget: campaign.budget
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!campaign || !editedCampaign) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          name: editedCampaign.name,
          description: editedCampaign.description,
          goals: editedCampaign.goals,
          target_audience: editedCampaign.target_audience,
          deliverables: editedCampaign.deliverables,
          start_date: editedCampaign.start_date,
          end_date: editedCampaign.end_date,
          budget: editedCampaign.budget
        })
        .eq('id', campaign.id);

      if (error) throw error;

      setCampaign(prev => prev ? { ...prev, ...editedCampaign } : null);
      setIsEditing(false);
      toast({
        title: "Changes saved",
        description: "Campaign details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof Campaign, value: any) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        console.error('Error creating conversation:', error);
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

      setCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          campaign_influencers: prev.campaign_influencers?.filter(ci => ci.id !== campaignInfluencerId)
        };
      });

      toast({
        title: "Influencer removed",
        description: "The influencer has been removed from the campaign.",
      });
    } catch (error) {
      console.error('Error removing influencer:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingInfluencerId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-snow mb-2">Campaign Not Found</h2>
        <p className="text-snow/60 mb-4">The campaign you're looking for doesn't exist or has been removed.</p>
        <Button
          onClick={() => navigate('/campaigns')}
          className="bg-purple-500 hover:bg-purple-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/campaigns')}
            variant="ghost"
            size="icon"
            className="text-snow/70 hover:text-snow"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            {isEditing ? (
              <Input
                value={editedCampaign.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-2xl font-bold text-snow bg-zinc-800 border-zinc-700"
                placeholder="Campaign Name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-snow">{campaign.name}</h1>
            )}
            <p className="text-snow/60">{campaign.brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
          <Button
            onClick={handleEditToggle}
            className={isEditing ? "bg-green-500 hover:bg-green-600" : "bg-purple-500 hover:bg-purple-600"}
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-snow/70">Budget</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedCampaign.budget || ''}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value))}
                    className="text-2xl font-bold text-snow bg-zinc-800 border-zinc-700"
                    placeholder="Enter budget"
                  />
                ) : (
                  <p className="text-2xl font-bold text-snow">${campaign.budget?.toLocaleString()}</p>
                )}
                <p className="text-xs text-snow/50 mt-1">
                  Spent: ${campaign.spent?.toLocaleString() || 0}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-snow/70">Timeline</p>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={editedCampaign.start_date || ''}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="text-sm text-snow bg-zinc-800 border-zinc-700"
                    />
                    <Input
                      type="date"
                      value={editedCampaign.end_date || ''}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className="text-sm text-snow bg-zinc-800 border-zinc-700"
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-snow">
                      {formatDate(campaign.start_date)}
                    </p>
                    <p className="text-xs text-snow/50 mt-1">
                      to {formatDate(campaign.end_date)}
                    </p>
                  </>
                )}
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-snow/70">Reach</p>
                <p className="text-2xl font-bold text-snow">
                  {campaign.reach?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-snow/50 mt-1">
                  {campaign.engagement_rate}% engagement
                </p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-snow/70">Progress</p>
                <p className="text-2xl font-bold text-snow">{calculateProgress()}%</p>
                <Progress value={calculateProgress()} className="mt-2" />
              </div>
              <CheckCircle2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-snow/70 mb-2">Description</h3>
              {isEditing ? (
                <Input
                  value={editedCampaign.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="text-snow bg-zinc-800 border-zinc-700"
                  placeholder="Campaign description"
                />
              ) : (
                <p className="text-snow">{campaign.description}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-snow/70 mb-2">Goals</h3>
              {isEditing ? (
                <Input
                  value={editedCampaign.goals || ''}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  className="text-snow bg-zinc-800 border-zinc-700"
                  placeholder="Campaign goals"
                />
              ) : (
                <p className="text-snow">{campaign.goals}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-snow/70 mb-2">Target Audience</h3>
              {isEditing ? (
                <Input
                  value={editedCampaign.target_audience || ''}
                  onChange={(e) => handleInputChange('target_audience', e.target.value)}
                  className="text-snow bg-zinc-800 border-zinc-700"
                  placeholder="Target audience"
                />
              ) : (
                <p className="text-snow">{campaign.target_audience}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-snow/70 mb-2">Deliverables</h3>
              {isEditing ? (
                <Input
                  value={editedCampaign.deliverables || ''}
                  onChange={(e) => handleInputChange('deliverables', e.target.value)}
                  className="text-snow bg-zinc-800 border-zinc-700"
                  placeholder="Campaign deliverables"
                />
              ) : (
                <p className="text-snow">{campaign.deliverables}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-snow">Campaign Influencers</CardTitle>
            <AddInfluencerDialog
              campaignId={campaign.id}
              onInfluencerAdded={() => {
                window.location.reload();
              }}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-snow/70">Influencer</TableHead>
                  <TableHead className="text-snow/70">Platform</TableHead>
                  <TableHead className="text-snow/70">Status</TableHead>
                  <TableHead className="text-snow/70">Followers</TableHead>
                  <TableHead className="text-snow/70">Engagement</TableHead>
                  <TableHead className="text-snow/70">Contact</TableHead>
                  {isEditing && <TableHead className="text-snow/70">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.campaign_influencers?.map((ci) => (
                  <TableRow key={ci.id} className="border-zinc-800">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={ci.influencer.avatar_url} />
                          <AvatarFallback>{ci.influencer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-snow font-medium">{ci.influencer.name}</p>
                          <p className="text-snow/60 text-sm">{ci.influencer.handle}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-snow/70">{ci.influencer.platform}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ci.status)}>
                        {ci.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-snow/70">
                      {ci.influencer.followers_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-snow/70">
                      {ci.influencer.engagement_rate}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {ci.influencer.phone_no && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-snow/70 hover:text-green-500 ${
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
                            className="text-snow/70 hover:text-red-500"
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

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">Campaign Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-snow/30 mb-4" />
              <h3 className="text-lg font-medium text-snow mb-2">Analytics Coming Soon</h3>
              <p className="text-snow/60">
                We're working on bringing you detailed campaign analytics.
                Check back soon for insights and performance metrics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignDetail;
