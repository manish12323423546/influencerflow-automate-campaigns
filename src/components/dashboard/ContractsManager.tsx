import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download, Eye, User, Building, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ContractsList from '@/components/contracts/ContractsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

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

const ContractsManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('local-contracts');
  const [contractAutomations, setContractAutomations] = useState<ContractAutomation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ContractAutomation | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

  useEffect(() => {
    fetchContractAutomationData();
  }, []);

  const fetchContractAutomationData = async () => {
    try {
      setIsLoading(true);

      // Fetch contract automation data
      const { data: contractData, error: contractError } = await supabase
        .from('contract_automation')
        .select('*')
        .order('id', { ascending: false });

      if (contractError) throw contractError;
      setContractAutomations(contractData || []);

    } catch (error) {
      console.error('Error fetching contract automation data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to fetch contract automation data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContract = (contract: ContractAutomation) => {
    setSelectedContract(contract);
    setIsContractDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger 
            value="local-contracts" 
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            Local Contracts
          </TabsTrigger>
          <TabsTrigger 
            value="contract-automation"
            className="data-[state=active]:bg-coral data-[state=active]:text-white"
          >
            Contract Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local-contracts" className="space-y-4">
          <ContractsList />
        </TabsContent>

        <TabsContent value="contract-automation" className="space-y-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-coral" />
                  Contract Automation Data
                </CardTitle>
                <Button
                  onClick={fetchContractAutomationData}
                  size="sm"
                  className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Refresh Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading contract automation data...</p>
                </div>
              ) : contractAutomations.length === 0 ? (
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
                                View
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
      </Tabs>

      {/* Contract Details Dialog */}
      <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-coral" />
              Contract Details
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Campaign</h3>
                  <p className="text-base font-medium">{selectedContract.campaign_title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="text-base font-medium">{selectedContract.campaign_date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Influencer</h3>
                  <p className="text-base font-medium">{selectedContract.influencer_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand</h3>
                  <p className="text-base font-medium">{selectedContract.brand_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Goal</h3>
                  <p className="text-base font-medium">{selectedContract.campaign_goal}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Deal Amount</h3>
                  <p className="text-base font-medium">{selectedContract.deal_amount || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Deliverables</h3>
                <p className="text-base">{selectedContract.deliverables}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Campaign Requirements</h3>
                <p className="text-base">{selectedContract.campaign_requirements}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Special Instructions</h3>
                <p className="text-base">{selectedContract.special_instructions || 'None'}</p>
              </div>

              {selectedContract.payment_method && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                  <p className="text-base">{selectedContract.payment_method}</p>
                </div>
              )}

              {selectedContract.payment_terms && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Payment Terms</h3>
                  <p className="text-base">{selectedContract.payment_terms}</p>
                </div>
              )}

              {selectedContract.brand_representative && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Brand Representative</h3>
                  <p className="text-base">{selectedContract.brand_representative}</p>
                </div>
              )}

              {selectedContract.download_url && (
                <div className="pt-4">
                  <Button
                    onClick={() => handleDownloadContract(selectedContract.download_url!)}
                    className="w-full bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Contract
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsManager;
