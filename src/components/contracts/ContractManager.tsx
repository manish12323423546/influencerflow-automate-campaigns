import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Send, Eye, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContractData {
  fee: number;
  deadline: string;
  template_id: string;
  generated_at: string;
}

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  contract_data: ContractData;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  content_md: string;
}

export const ContractManager: React.FC = () => {
  const { user, session } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Form states
  const [newContract, setNewContract] = useState({
    campaign_id: '',
    influencer_id: '',
    template_id: '',
    fee: '',
    deadline: '',
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    template_type: 'standard',
    content_md: '',
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch contracts
      await fetchContracts();

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('contract_templates')
        .select('*');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id);

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch influencers
      const { data: influencersData, error: influencersError } = await supabase
        .from('influencers')
        .select('*');

      if (influencersError) throw influencersError;
      setInfluencers(influencersData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createContract = async () => {
    if (!user) return;

    try {
      const { campaign_id, influencer_id, template_id, fee, deadline } = newContract;

      // Call the edge function to create the contract
      const response = await fetch('/api/create-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          campaignId: campaign_id,
          influencerId: influencer_id,
          templateId: template_id,
          fee: parseFloat(fee),
          deadline: deadline
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        fetchContracts(); // Refresh contracts
      } else {
        toast.error(result.error || 'Failed to create contract');
      }

    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    }
  };

  const createTemplate = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .insert({
          name: newTemplate.name,
          template_type: newTemplate.template_type,
          content_md: newTemplate.content_md,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Template created successfully!');
      setShowTemplateDialog(false);
      fetchData(); // Refresh templates

    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  const deleteContract = async (contractId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast.success('Contract deleted successfully!');
      fetchContracts(); // Refresh contracts

    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  const fetchContracts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          campaigns (name, brand),
          influencers (name, handle, platform, avatar_url)
        `)
        .eq('brand_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Contract interface
      const transformedContracts = data?.map(contract => ({
        ...contract,
        contract_data: contract.contract_data as ContractData || {
          fee: 0,
          deadline: '',
          template_id: '',
          generated_at: contract.created_at
        }
      })) || [];

      setContracts(transformedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    }
  };

  const handleDownloadContract = async (contract: Contract) => {
    try {
      const { data, error } = await supabase.storage
        .from('contracts')
        .createSignedUrl(contract.pdf_url, 60, { download: true });

      if (error) throw error;

      // Open the signed URL in a new tab for download
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error generating signed URL:', error);
      toast.error('Failed to download contract');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground">Create, manage, and track influencer contracts</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Contract
          </Button>
        </div>
      </div>

      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="contracts" className="space-y-4">
          {loading ? (
            <p>Loading contracts...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contracts.map((contract) => (
                <Card key={contract.id} className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{contract.campaigns?.name} - {contract.influencers?.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary">{contract.status}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Fee: ${contract.contract_data?.fee}</p>
                    <p className="text-sm text-muted-foreground">Deadline: {contract.contract_data?.deadline}</p>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button size="sm" variant="ghost" onClick={() => handleDownloadContract(contract)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteContract(contract.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          {loading ? (
            <p>Loading templates...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{template.template_type}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{template.content_md.substring(0, 100)}...</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={() => setShowCreateDialog(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Contract</DialogTitle>
            <DialogDescription>Fill in the details to generate a new contract.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaign_id" className="text-right">
                Campaign
              </Label>
              <Select onValueChange={(value) => setNewContract(prev => ({ ...prev, campaign_id: value }))} defaultValue={newContract.campaign_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="influencer_id" className="text-right">
                Influencer
              </Label>
              <Select onValueChange={(value) => setNewContract(prev => ({ ...prev, influencer_id: value }))} defaultValue={newContract.influencer_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an influencer" />
                </SelectTrigger>
                <SelectContent>
                  {influencers.map(influencer => (
                    <SelectItem key={influencer.id} value={influencer.id}>{influencer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template_id" className="text-right">
                Template
              </Label>
              <Select onValueChange={(value) => setNewContract(prev => ({ ...prev, template_id: value }))} defaultValue={newContract.template_id}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fee" className="text-right">
                Fee
              </Label>
              <Input type="number" id="fee" name="fee" value={newContract.fee} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right">
                Deadline
              </Label>
              <Input type="date" id="deadline" name="deadline" value={newContract.deadline} onChange={handleInputChange} className="col-span-3" />
            </div>
          </div>
          <Button onClick={createContract}>Create Contract</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={() => setShowTemplateDialog(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Define a new contract template.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input type="text" id="name" name="name" value={newTemplate.name} onChange={handleTemplateInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template_type" className="text-right">
                Type
              </Label>
              <Select onValueChange={(value) => setNewTemplate(prev => ({ ...prev, template_type: value }))} defaultValue={newTemplate.template_type}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content_md" className="text-right">
                Content (Markdown)
              </Label>
              <Textarea id="content_md" name="content_md" value={newTemplate.content_md} onChange={handleTemplateInputChange} className="col-span-3" />
            </div>
          </div>
          <Button onClick={createTemplate}>Create Template</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
