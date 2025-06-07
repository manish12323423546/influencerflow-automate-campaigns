import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Mail,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Target,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  ExternalLink,
  X,
  Clock,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractAutomation {
  id: number;
  campaign_date: string;
  influencer_name: string;
  brand_name: string;
  campaign_title: string;
  campaign_goal: string;
  deliverables: string;
  campaign_requirements: string;
  special_instructions: string;
  deal_amount?: string;
  payment_method?: string;
  payment_terms?: string;
  brand_representative?: string;
  download_url?: string;
}

interface EmailAutomation {
  id: number;
  campaign_id: string;
  campaign_name: string;
  competitor_brands: any;
  influencer_id: string;
  influencer_name: string;
  instagram_handle?: string;
  youtube_handle?: string;
  followers_instagram?: number;
  followers_youtube?: number;
  engagement_rate?: number;
  influencer_category?: string;
  contract_id: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  deliverables: any;
  total_fee?: number;
  currency?: string;
  payment_schedule: any;
  termination_clause?: string;
  exclusivity_applicable?: boolean;
  exclusivity_category?: string;
  exclusivity_duration?: string;
}

const EmailConversionManager = () => {
  const { toast } = useToast();
  const [contractAutomations, setContractAutomations] = useState<ContractAutomation[]>([]);
  const [emailAutomations, setEmailAutomations] = useState<EmailAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contract-automation');
  const [selectedContract, setSelectedContract] = useState<ContractAutomation | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailAutomation | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  useEffect(() => {
    fetchEmailConversionData();
  }, []);

  const fetchEmailConversionData = async () => {
    try {
      setIsLoading(true);

      // Fetch contract automation data
      const { data: contractData, error: contractError } = await supabase
        .from('contract_automation')
        .select('*')
        .order('id', { ascending: false });

      if (contractError) throw contractError;
      setContractAutomations(contractData || []);

      // Fetch email automation data
      const { data: emailData, error: emailError } = await supabase
        .from('email_automation')
        .select('*')
        .order('id', { ascending: false });

      if (emailError) throw emailError;
      setEmailAutomations(emailData || []);

    } catch (error) {
      console.error('Error fetching email conversion data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to fetch email conversion data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return 'N/A';
    return `${currency || '$'}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewContract = (contract: ContractAutomation) => {
    setSelectedContract(contract);
    setIsContractDialogOpen(true);
  };

  const handleViewEmail = (email: EmailAutomation) => {
    setSelectedEmail(email);
    setIsEmailDialogOpen(true);
  };

  const handleDownloadContract = (downloadUrl: string) => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      toast({
        title: "Download not available",
        description: "No download URL found for this contract.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email conversion data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Conversion Analytics</h2>
          <p className="text-gray-600">Track contract automation and email automation performance</p>
        </div>
        <Button
          onClick={fetchEmailConversionData}
          className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Contract Automations</CardTitle>
            <FileText className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{contractAutomations.length}</div>
            <p className="text-xs text-gray-500">Total contracts generated</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Email Automations</CardTitle>
            <Mail className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{emailAutomations.length}</div>
            <p className="text-xs text-gray-500">Total email campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                emailAutomations.reduce((sum, item) => sum + (item.total_fee || 0), 0)
              )}
            </div>
            <p className="text-xs text-gray-500">Combined contract value</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {contractAutomations.length > 0 
                ? ((emailAutomations.length / contractAutomations.length) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-gray-500">Email to contract ratio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different data views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger 
            value="contract-automation" 
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            Contract Automation
          </TabsTrigger>
          <TabsTrigger 
            value="email-automation"
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            Email Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract-automation" className="space-y-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-coral" />
                Contract Automation Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractAutomations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contract automation data found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Campaign Date</TableHead>
                        <TableHead className="text-gray-600">Influencer</TableHead>
                        <TableHead className="text-gray-600">Brand</TableHead>
                        <TableHead className="text-gray-600">Campaign Title</TableHead>
                        <TableHead className="text-gray-600">Goal</TableHead>
                        <TableHead className="text-gray-600">Deal Amount</TableHead>
                        <TableHead className="text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractAutomations.map((contract) => (
                        <TableRow key={contract.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell className="font-medium">{contract.campaign_date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {contract.influencer_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              {contract.brand_name}
                            </div>
                          </TableCell>
                          <TableCell>{contract.campaign_title}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-coral border-coral">
                              {contract.campaign_goal}
                            </Badge>
                          </TableCell>
                          <TableCell>{contract.deal_amount || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewContract(contract)}
                                className="text-coral border-coral hover:bg-coral hover:text-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View this
                              </Button>
                              {contract.download_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadContract(contract.download_url!)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-automation" className="space-y-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-coral" />
                Email Automation Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailAutomations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No email automation data found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Campaign</TableHead>
                        <TableHead className="text-gray-600">Influencer</TableHead>
                        <TableHead className="text-gray-600">Social Handles</TableHead>
                        <TableHead className="text-gray-600">Followers</TableHead>
                        <TableHead className="text-gray-600">Engagement</TableHead>
                        <TableHead className="text-gray-600">Contract Value</TableHead>
                        <TableHead className="text-gray-600">Contract Period</TableHead>
                        <TableHead className="text-gray-600">Status</TableHead>
                        <TableHead className="text-gray-600">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailAutomations.map((email) => (
                        <TableRow key={email.id} className="border-gray-200 hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{email.campaign_name}</div>
                              <div className="text-sm text-gray-500">ID: {email.campaign_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                {email.influencer_name}
                              </div>
                              {email.influencer_category && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                  {email.influencer_category}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {email.instagram_handle && (
                                <div className="text-sm">IG: @{email.instagram_handle}</div>
                              )}
                              {email.youtube_handle && (
                                <div className="text-sm">YT: @{email.youtube_handle}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {email.followers_instagram && (
                                <div className="text-sm">IG: {email.followers_instagram.toLocaleString()}</div>
                              )}
                              {email.followers_youtube && (
                                <div className="text-sm">YT: {email.followers_youtube.toLocaleString()}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {email.engagement_rate ? (
                              <Badge variant="outline" className="text-coral border-coral">
                                {(email.engagement_rate * 100).toFixed(1)}%
                              </Badge>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(email.total_fee, email.currency)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Contract: {email.contract_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                Start: {formatDate(email.contract_start_date)}
                              </div>
                              <div className="text-sm">
                                End: {formatDate(email.contract_end_date)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {email.exclusivity_applicable && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  Exclusive
                                </Badge>
                              )}
                              {email.contract_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {email.contract_type}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewEmail(email)}
                              className="text-coral border-coral hover:bg-coral hover:text-white"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View this
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contract Automation Detail Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-coral" />
              Contract Automation Details
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{selectedContract.campaign_date}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign Title</label>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span>{selectedContract.campaign_title}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Influencer Name</label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{selectedContract.influencer_name}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Brand Name</label>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>{selectedContract.brand_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign Goal</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedContract.campaign_goal}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Deliverables</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedContract.deliverables}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign Requirements</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedContract.campaign_requirements}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedContract.special_instructions}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Deal Amount</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{selectedContract.deal_amount || 'Not specified'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <span>{selectedContract.payment_method || 'Not specified'}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Payment Terms</label>
                    <span>{selectedContract.payment_terms || 'Not specified'}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Brand Representative</label>
                    <span>{selectedContract.brand_representative || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Download */}
              {selectedContract.download_url && (
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-coral" />
                        <div>
                          <p className="font-medium">Contract Document</p>
                          <p className="text-sm text-gray-500">Click to download or view the contract</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDownloadContract(selectedContract.download_url!)}
                          className="bg-coral hover:bg-coral/90 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(selectedContract.download_url, '_blank')}
                          className="border-coral text-coral hover:bg-coral hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Online
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Automation Detail Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-coral" />
              Email Automation Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-6">
              {/* Campaign Information */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign Name</label>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span>{selectedEmail.campaign_name}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Campaign ID</label>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedEmail.campaign_id}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Contract ID</label>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedEmail.contract_id}</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Contract Type</label>
                    <span>{selectedEmail.contract_type || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Influencer Information */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Influencer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Influencer Name</label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedEmail.influencer_name}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Influencer ID</label>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedEmail.influencer_id}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Category</label>
                      <span>{selectedEmail.influencer_category || 'Not specified'}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Engagement Rate</label>
                      <span>{selectedEmail.engagement_rate ? `${(selectedEmail.engagement_rate * 100).toFixed(1)}%` : 'Not specified'}</span>
                    </div>
                  </div>

                  {/* Social Media Handles */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-600">Social Media Handles</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEmail.instagram_handle && (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">IG</span>
                          </div>
                          <div>
                            <p className="font-medium">@{selectedEmail.instagram_handle}</p>
                            <p className="text-sm text-gray-500">{selectedEmail.followers_instagram?.toLocaleString()} followers</p>
                          </div>
                        </div>
                      )}
                      {selectedEmail.youtube_handle && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">YT</span>
                          </div>
                          <div>
                            <p className="font-medium">@{selectedEmail.youtube_handle}</p>
                            <p className="text-sm text-gray-500">{selectedEmail.followers_youtube?.toLocaleString()} subscribers</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Details */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Contract Start Date</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(selectedEmail.contract_start_date)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Contract End Date</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(selectedEmail.contract_end_date)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Total Fee</label>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{formatCurrency(selectedEmail.total_fee, selectedEmail.currency)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Currency</label>
                      <span>{selectedEmail.currency || 'USD'}</span>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Deliverables</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(selectedEmail.deliverables, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Payment Schedule */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Payment Schedule</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(selectedEmail.payment_schedule, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Termination Clause */}
                  {selectedEmail.termination_clause && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Termination Clause</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedEmail.termination_clause}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exclusivity Information */}
              {selectedEmail.exclusivity_applicable && (
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Exclusivity Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Exclusivity Category</label>
                      <span>{selectedEmail.exclusivity_category || 'Not specified'}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Exclusivity Duration</label>
                      <span>{selectedEmail.exclusivity_duration || 'Not specified'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Competitor Brands */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Competitor Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                      {JSON.stringify(selectedEmail.competitor_brands, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailConversionManager;
