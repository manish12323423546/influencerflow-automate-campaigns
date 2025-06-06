import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ContractsList from './ContractsList';
import type { Campaign } from '@/types/campaign';
import { useQueryClient } from '@tanstack/react-query';
import { saveContractToLocalStorage } from "@/lib/utils/storage";

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers_count: number;
  engagement_rate: number;
  avatar_url?: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  template_type: string;
  content_md: string;
  created_at: string;
  updated_at: string;
}

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  template_id: string;
  pdf_url: string;
  created_at: string;
  campaigns?: { name: string };
  influencers?: { name: string };
}

interface CampaignInfluencer {
  influencer_id: string;
  influencers: Influencer;
}

interface ContractManagerProps {
  campaignId?: string;
}

export const ContractManager = ({ campaignId: initialCampaignId }: ContractManagerProps) => {
  const { toast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(initialCampaignId || '');
  const [selectedInfluencer, setSelectedInfluencer] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch campaigns using useEffect like in Campaigns.tsx
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log('Fetching campaigns from Supabase...');
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching campaigns:', error);
          throw error;
        }
        
        console.log('Fetched campaigns:', data);
        setCampaigns(data || []);
      } catch (error) {
        console.error('Error in fetchCampaigns:', error);
        toast({
          title: "Error loading campaigns",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [toast]);

  // Fetch influencers for selected campaign
  const { data: influencers, isLoading: influencersLoading } = useQuery({
    queryKey: ['influencers-for-campaign', selectedCampaign],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_influencers')
        .select(`
          influencer_id,
          influencers (
            id,
            name,
            handle,
            platform,
            followers_count,
            engagement_rate,
            avatar_url
          )
        `)
        .eq('campaign_id', selectedCampaign);

      if (error) throw error;
      return (data as unknown as CampaignInfluencer[]).map(ci => ci.influencers);
    },
    enabled: !!selectedCampaign,
  });

  // Fetch contract templates
  const { data: contractTemplates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ContractTemplate[];
    },
  });

  const handleCreateContract = async () => {
    if (!selectedCampaign || !selectedInfluencer || !selectedTemplate) {
      toast({
        title: "Selection Required",
        description: "Please select a campaign, influencer, and contract template",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get selected data
      const selectedCampaignData = campaigns?.find(c => c.id === selectedCampaign);
      const selectedInfluencerData = influencers?.find(i => i.id === selectedInfluencer);
      const selectedTemplateData = contractTemplates?.find(t => t.id === selectedTemplate);

      if (!selectedCampaignData || !selectedInfluencerData || !selectedTemplateData) {
        throw new Error('Required data not found');
      }

      // Create contract object
      const contract = {
        id: crypto.randomUUID(),
        campaign_id: selectedCampaign,
        influencer_id: selectedInfluencer,
        brand_user_id: "d0d7d0d7-d0d7-d0d7-d0d7-d0d7d0d7d0d7", // Hardcoded brand_user_id
        contract_data: {
          fee: selectedCampaignData.budget || 0,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          template_id: selectedTemplate,
          generated_at: new Date().toISOString(),
        },
        status: "DRAFT",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert contract into Supabase
      const { data: storedContract, error } = await supabase
        .from('contracts')
        .insert(contract)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Save to localStorage
      const savedLocally = saveContractToLocalStorage({
        pdfBase64: '', // We're not generating PDF for now
        fileName: `contract_${selectedCampaignData.name}_${selectedInfluencerData.name}.pdf`,
        contract: storedContract,
        timestamp: new Date().toISOString()
      });

      if (!savedLocally) {
        toast({
          title: "Warning",
          description: "Contract saved to database but couldn't be saved locally",
          variant: "default",
        });
      }

      // Success!
      toast({
        title: "Contract Created",
        description: "The contract has been saved successfully",
      });

      // Reset form
      setSelectedCampaign('');
      setSelectedInfluencer('');
      setSelectedTemplate('');
      setCreateModalOpen(false);

      // Refresh contracts list
      queryClient.invalidateQueries({ queryKey: ['contracts'] });

    } catch (error) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create contract",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = (pdfUrl: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF not available",
        description: "This contract doesn't have a PDF file.",
        variant: "destructive",
      });
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Contract Management</h2>
          <p className="text-gray-600">Create and manage influencer contracts</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Contract
        </Button>
      </div>

      <ContractsList />

      {/* Create Contract Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Campaign Selection */}
            <div>
              <Label>Select Campaign</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No campaigns found. Please create a campaign first.
                </div>
              ) : (
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {campaigns.map((campaign) => (
                      <SelectItem
                        key={campaign.id}
                        value={campaign.id}
                        className="focus:bg-coral/10"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-sm text-gray-600">
                            {campaign.brand} • ${campaign.budget.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge className={getStatusBadgeColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                            <span>{campaign.influencer_count} influencers</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Influencer Selection */}
            {selectedCampaign && (
              <div>
                <Label>Select Influencer</Label>
                <RadioGroup value={selectedInfluencer} onValueChange={setSelectedInfluencer}>
                  <div className="space-y-4 mt-2">
                    {influencers?.map((influencer) => (
                      <div
                        key={influencer.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                          selectedInfluencer === influencer.id
                            ? 'bg-coral/10 border-coral'
                            : 'bg-gray-50 border-gray-200 hover:border-coral/50'
                        }`}
                      >
                        <RadioGroupItem value={influencer.id} id={influencer.id} />
                        <div className="flex items-center flex-1 space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={influencer.avatar_url} />
                            <AvatarFallback>{influencer.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={influencer.id} className="flex-1 cursor-pointer">
                            <div className="font-medium text-gray-900">{influencer.name}</div>
                            <div className="text-sm text-gray-600">
                              {influencer.handle} • {formatFollowers(influencer.followers_count)} followers
                            </div>
                          </Label>
                          <Badge variant="outline" className="ml-auto border-gray-300 text-gray-600">
                            {influencer.platform}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Template Selection */}
            {selectedInfluencer && (
              <div>
                <Label>Select Contract Template</Label>
                <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <div className="space-y-4 mt-2">
                    {contractTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                          selectedTemplate === template.id
                            ? 'bg-coral/10 border-coral'
                            : 'bg-gray-50 border-gray-200 hover:border-coral/50'
                        }`}
                      >
                        <RadioGroupItem value={template.id} id={template.id} />
                        <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.template_type}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleCreateContract}
                disabled={isCreating || !selectedCampaign || !selectedInfluencer || !selectedTemplate}
                className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Contract'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
