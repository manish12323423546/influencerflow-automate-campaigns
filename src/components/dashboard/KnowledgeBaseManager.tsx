import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, Upload, Link as LinkIcon, Search, Loader2, Trash2, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Campaign } from '@/types/campaign';
import axios from 'axios';

interface KnowledgeBaseDocument {
  id: string;
  name: string;
  metadata: {
    created_at_unix_secs: number;
    last_updated_at_unix_secs: number;
    size_bytes: number;
  };
  prompt_injectable: boolean;
  access_info: {
    is_creator: boolean;
    creator_name: string;
    creator_email: string;
    role: string;
  };
  type: string;
  url?: string;
}

interface KnowledgeBaseResponse {
  documents: KnowledgeBaseDocument[];
  has_more: boolean;
  next_cursor?: string;
}

const KnowledgeBaseManager = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'text' | 'file' | 'url' | 'campaigns'>('text');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    url: '',
    file: null as File | null
  });

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const baseUrl = 'https://api.elevenlabs.io/v1/convai/knowledge-base';

  // Fetch knowledge base documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(baseUrl, {
        headers: {
          'xi-api-key': apiKey
        },
        params: {
          page_size: 100,
          search: searchTerm || undefined
        }
      });

      const data: KnowledgeBaseResponse = response.data;
      setDocuments(data.documents);
    } catch (error) {
      console.error('Error fetching knowledge base documents:', error);
      toast({
        title: "Error loading documents",
        description: "Failed to fetch knowledge base documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns from Supabase with ALL fields
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched complete campaign data:', data);
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error loading campaigns",
        description: "Failed to fetch campaigns data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchDocuments();
      fetchCampaigns();
    }
  }, [apiKey, searchTerm]);

  // Create document from text
  const createFromText = async () => {
    try {
      setIsCreating(true);
      const response = await axios.post(
        `${baseUrl}/text`,
        {
          text: formData.text,
          name: formData.name || undefined
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      toast({
        title: "Document created",
        description: "Knowledge base document created successfully from text.",
      });

      setIsCreateModalOpen(false);
      setFormData({ name: '', text: '', url: '', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document from text:', error);
      toast({
        title: "Error creating document",
        description: "Failed to create knowledge base document from text.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Create document from file or URL
  const createFromFileOrUrl = async () => {
    try {
      setIsCreating(true);
      const formDataToSend = new FormData();
      
      if (formData.name) {
        formDataToSend.append('name', formData.name);
      }

      if (createType === 'file' && formData.file) {
        formDataToSend.append('file', formData.file);
      } else if (createType === 'url' && formData.url) {
        formDataToSend.append('url', formData.url);
      }

      const response = await axios.post(
        baseUrl,
        formDataToSend,
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast({
        title: "Document created",
        description: `Knowledge base document created successfully from ${createType}.`,
      });

      setIsCreateModalOpen(false);
      setFormData({ name: '', text: '', url: '', file: null });
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error creating document",
        description: `Failed to create knowledge base document from ${createType}.`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Create document from campaigns with complete data
  const createFromCampaigns = async () => {
    if (selectedCampaigns.length === 0) {
      toast({
        title: "No campaigns selected",
        description: "Please select at least one campaign to add to knowledge base.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const selectedCampaignData = campaigns.filter(campaign => 
        selectedCampaigns.includes(campaign.id)
      );

      console.log('Selected campaigns with complete data:', selectedCampaignData);

      // Format campaign data for knowledge base with ALL available fields
      const campaignText = selectedCampaignData.map(campaign => {
        return `CAMPAIGN DETAILS:
Campaign ID: ${campaign.id}
Campaign Name: ${campaign.name}
Brand: ${campaign.brand}
Description: ${campaign.description || 'No description provided'}
Status: ${campaign.status}
Budget: $${campaign.budget.toLocaleString()}
Amount Spent: $${campaign.spent.toLocaleString()}
Remaining Budget: $${(campaign.budget - campaign.spent).toLocaleString()}
Influencer Count: ${campaign.influencer_count}
Total Reach: ${campaign.reach.toLocaleString()}
Engagement Rate: ${campaign.engagement_rate}%
Goals: ${campaign.goals || 'No goals specified'}
Target Audience: ${campaign.target_audience || 'No target audience specified'}
Deliverables: ${campaign.deliverables || 'No deliverables specified'}
Timeline: ${campaign.timeline || 'No timeline specified'}
User ID: ${campaign.user_id}
Created Date: ${new Date(campaign.created_at).toLocaleDateString()}
Created Time: ${new Date(campaign.created_at).toLocaleTimeString()}
Last Updated: ${new Date(campaign.updated_at).toLocaleDateString()}
Last Updated Time: ${new Date(campaign.updated_at).toLocaleTimeString()}
Campaign Performance Metrics:
- Total Budget: $${campaign.budget.toLocaleString()}
- Budget Utilized: $${campaign.spent.toLocaleString()}
- Budget Utilization Rate: ${((campaign.spent / campaign.budget) * 100).toFixed(2)}%
- Cost Per Influencer: $${campaign.influencer_count > 0 ? (campaign.spent / campaign.influencer_count).toFixed(2) : '0'}
- Average Reach Per Dollar: ${campaign.spent > 0 ? (campaign.reach / campaign.spent).toFixed(2) : campaign.reach}
- Engagement Rate: ${campaign.engagement_rate}%
Campaign Status Analysis:
- Current Status: ${campaign.status}
- Campaign Duration: From ${new Date(campaign.created_at).toLocaleDateString()} to present
- Days Running: ${Math.floor((new Date().getTime() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
Additional Information:
- Campaign Goals: ${campaign.goals || 'Not specified'}
- Target Audience Details: ${campaign.target_audience || 'Not specified'}
- Expected Deliverables: ${campaign.deliverables || 'Not specified'}
- Project Timeline: ${campaign.timeline || 'Not specified'}
=====================================`;
      }).join('\n\n');

      const documentName = selectedCampaignData.length === 1 
        ? `Complete Campaign Data: ${selectedCampaignData[0].name}`
        : `Complete Data for ${selectedCampaignData.length} Selected Campaigns`;

      console.log('Sending campaign data to knowledge base:', {
        documentName,
        textLength: campaignText.length,
        campaignCount: selectedCampaignData.length
      });

      const response = await axios.post(
        `${baseUrl}/text`,
        {
          text: campaignText,
          name: documentName
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Knowledge base document created:', response.data);

      toast({
        title: "Complete campaign data added to knowledge base",
        description: `Successfully added complete data for ${selectedCampaigns.length} campaign(s) to knowledge base with all available fields.`,
      });

      setIsCampaignModalOpen(false);
      setSelectedCampaigns([]);
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document from campaigns:', error);
      toast({
        title: "Error adding campaigns",
        description: "Failed to add campaigns to knowledge base.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreate = async () => {
    if (createType === 'text') {
      await createFromText();
    } else {
      await createFromFileOrUrl();
    }
  };

  const handleCampaignSelection = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleSelectAllCampaigns = () => {
    if (selectedCampaigns.length === campaigns.length) {
      setSelectedCampaigns([]);
    } else {
      setSelectedCampaigns(campaigns.map(campaign => campaign.id));
    }
  };

  const formatDate = (unixSeconds: number) => {
    return new Date(unixSeconds * 1000).toLocaleDateString();
  };

  const formatSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!apiKey) {
    return (
      <div className="p-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-snow mb-2">ElevenLabs API Key Required</h3>
              <p className="text-snow/70 mb-4">
                Please configure your ElevenLabs API key to manage knowledge base documents.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-snow">Knowledge Base</h2>
          <p className="text-snow/70">Manage your AI knowledge base documents</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCampaignModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Target className="mr-2 h-4 w-4" />
            Add Campaigns
          </Button>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-coral hover:bg-coral/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-snow"
          />
        </div>
        <Button
          onClick={fetchDocuments}
          variant="outline"
          className="border-zinc-700 text-snow hover:bg-zinc-800"
        >
          Refresh
        </Button>
      </div>

      {/* Documents Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-snow">Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-coral" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-snow mb-2">No documents found</h3>
              <p className="text-snow/70 mb-4">
                {searchTerm ? 'No documents match your search.' : 'Start by creating your first knowledge base document.'}
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Add Campaigns
                </Button>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-coral hover:bg-coral/90 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Document
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-snow/80">Name</TableHead>
                  <TableHead className="text-snow/80">Type</TableHead>
                  <TableHead className="text-snow/80">Size</TableHead>
                  <TableHead className="text-snow/80">Created</TableHead>
                  <TableHead className="text-snow/80">Updated</TableHead>
                  <TableHead className="text-snow/80">Injectable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="border-zinc-800">
                    <TableCell className="text-snow font-medium">
                      <div className="flex items-center space-x-2">
                        {doc.type === 'url' ? (
                          <LinkIcon className="h-4 w-4 text-blue-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-400" />
                        )}
                        <span>{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-snow/70 capitalize">{doc.type}</TableCell>
                    <TableCell className="text-snow/70">{formatSize(doc.metadata.size_bytes)}</TableCell>
                    <TableCell className="text-snow/70">{formatDate(doc.metadata.created_at_unix_secs)}</TableCell>
                    <TableCell className="text-snow/70">{formatDate(doc.metadata.last_updated_at_unix_secs)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doc.prompt_injectable 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {doc.prompt_injectable ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Campaigns Modal */}
      <Dialog open={isCampaignModalOpen} onOpenChange={setIsCampaignModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-snow max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Complete Campaign Data to Knowledge Base</DialogTitle>
            <DialogDescription className="text-snow/70">
              Select campaigns to add their complete data to your knowledge base. This will include all available fields and performance metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select All Button */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handleSelectAllCampaigns}
                variant="outline"
                className="border-zinc-700 text-snow hover:bg-zinc-800"
              >
                <Users className="mr-2 h-4 w-4" />
                {selectedCampaigns.length === campaigns.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-snow/70">
                {selectedCampaigns.length} of {campaigns.length} campaigns selected
              </span>
            </div>

            {/* Campaigns List with enhanced display */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <Checkbox
                    checked={selectedCampaigns.includes(campaign.id)}
                    onCheckedChange={(checked) => 
                      handleCampaignSelection(campaign.id, checked as boolean)
                    }
                    className="border-zinc-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-snow font-medium truncate">{campaign.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        campaign.status === 'active' 
                          ? 'bg-green-500/20 text-green-400'
                          : campaign.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-snow/70">Brand: {campaign.brand}</p>
                      <p className="text-snow/60">Budget: ${campaign.budget.toLocaleString()}</p>
                      <p className="text-snow/60">Spent: ${campaign.spent.toLocaleString()}</p>
                      <p className="text-snow/60">Reach: {campaign.reach.toLocaleString()}</p>
                    </div>
                    <p className="text-snow/50 text-xs mt-1">
                      Created: {new Date(campaign.created_at).toLocaleDateString()} | 
                      Updated: {new Date(campaign.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCampaignModalOpen(false)}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={createFromCampaigns}
              disabled={isCreating || selectedCampaigns.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Complete Data...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Add Complete Campaign Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-snow max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Knowledge Base Document</DialogTitle>
            <DialogDescription className="text-snow/70">
              Create a new knowledge base document from text, file, or URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type Selection */}
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={createType === 'text' ? 'default' : 'outline'}
                onClick={() => setCreateType('text')}
                className={createType === 'text' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
              >
                <FileText className="mr-2 h-4 w-4" />
                Text
              </Button>
              <Button
                type="button"
                variant={createType === 'file' ? 'default' : 'outline'}
                onClick={() => setCreateType('file')}
                className={createType === 'file' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
              >
                <Upload className="mr-2 h-4 w-4" />
                File
              </Button>
              <Button
                type="button"
                variant={createType === 'url' ? 'default' : 'outline'}
                onClick={() => setCreateType('url')}
                className={createType === 'url' ? 'bg-coral hover:bg-coral/90' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                URL
              </Button>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-snow">Document Name (Optional)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name..."
                className="bg-zinc-800 border-zinc-700 text-snow"
              />
            </div>

            {/* Content Fields */}
            {createType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="text" className="text-snow">Text Content *</Label>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter text content for the knowledge base..."
                  rows={6}
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>
            )}

            {createType === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file" className="text-snow">Upload File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="bg-zinc-800 border-zinc-700 text-snow"
                  accept=".txt,.md,.pdf,.doc,.docx"
                />
                <p className="text-xs text-snow/60">Supported formats: TXT, MD, PDF, DOC, DOCX</p>
              </div>
            )}

            {createType === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="url" className="text-snow">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/documentation"
                  className="bg-zinc-800 border-zinc-700 text-snow"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating ||
                (createType === 'text' && !formData.text.trim()) ||
                (createType === 'file' && !formData.file) ||
                (createType === 'url' && !formData.url.trim())
              }
              className="bg-coral hover:bg-coral/90 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBaseManager;
