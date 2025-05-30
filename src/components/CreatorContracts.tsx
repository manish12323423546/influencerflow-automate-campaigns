
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, PenTool, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Contract {
  id: string;
  campaign_id: string;
  brand_user_id: string;
  contract_data: any;
  status: 'drafted' | 'sent' | 'signed' | 'completed';
  signed_at: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  campaign_name?: string;
  brand_name?: string;
  brand_logo?: string;
  amount?: number;
}

// Mock data for demonstration
const mockContracts: Contract[] = [
  {
    id: '1',
    campaign_id: '1',
    brand_user_id: 'brand-1',
    contract_data: {
      deliverables: ['3 Instagram Posts', '1 Reel', '5 Stories'],
      payment_terms: 'Net 30',
      usage_rights: '1 year',
      exclusivity: 'Category exclusive for 6 months'
    },
    status: 'sent',
    signed_at: null,
    pdf_url: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    campaign_name: 'Tech Product Launch',
    brand_name: 'TechCorp',
    brand_logo: '/placeholder.svg',
    amount: 2500
  },
  {
    id: '2',
    campaign_id: '2',
    brand_user_id: 'brand-2',
    contract_data: {
      deliverables: ['2 Instagram Posts', '3 Stories'],
      payment_terms: 'Net 15',
      usage_rights: '6 months',
      exclusivity: 'Non-exclusive'
    },
    status: 'signed',
    signed_at: '2024-01-10T14:30:00Z',
    pdf_url: '/contracts/contract-2.pdf',
    created_at: '2024-01-08T09:00:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    campaign_name: 'Fashion Summer Collection',
    brand_name: 'StyleBrand',
    brand_logo: '/placeholder.svg',
    amount: 1800
  },
  {
    id: '3',
    campaign_id: '3',
    brand_user_id: 'brand-3',
    contract_data: {
      deliverables: ['1 YouTube Video', '2 Instagram Posts'],
      payment_terms: 'Net 30',
      usage_rights: '2 years',
      exclusivity: 'Platform exclusive for 3 months'
    },
    status: 'completed',
    signed_at: '2023-12-20T11:15:00Z',
    pdf_url: '/contracts/contract-3.pdf',
    created_at: '2023-12-15T08:00:00Z',
    updated_at: '2023-12-28T16:00:00Z',
    campaign_name: 'Fitness App Promotion',
    brand_name: 'FitLife',
    brand_logo: '/placeholder.svg',
    amount: 3200
  }
];

const CreatorContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isSigningContract, setIsSigningContract] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      // For now, using mock data. In production, this would fetch from Supabase
      // const { data, error } = await supabase
      //   .from('contracts')
      //   .select(`
      //     *,
      //     campaigns(name),
      //     brand_profiles(company_name, company_logo_url)
      //   `)
      //   .order('created_at', { ascending: false });

      // if (error) throw error;
      
      // For demo purposes, using mock data
      setContracts(mockContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
      // Fallback to mock data
      setContracts(mockContracts);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'drafted':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'drafted':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleSignContract = async (contractId: string) => {
    setIsSigningContract(true);
    try {
      // Simulate e-signature process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update contract status
      setContracts(prev => prev.map(contract => 
        contract.id === contractId 
          ? { 
              ...contract, 
              status: 'signed' as const, 
              signed_at: new Date().toISOString() 
            }
          : contract
      ));

      toast({
        title: 'Contract signed successfully',
        description: 'Your electronic signature has been recorded.',
      });

      setSelectedContract(null);
    } catch (error) {
      toast({
        title: 'Error signing contract',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningContract(false);
    }
  };

  const downloadContract = (contractId: string, contractName: string) => {
    // Simulate PDF download
    toast({
      title: 'Downloading contract',
      description: `${contractName} contract is being downloaded.`,
    });
  };

  const pendingContracts = contracts.filter(c => c.status === 'sent');
  const signedContracts = contracts.filter(c => c.status === 'signed' || c.status === 'completed');
  const draftContracts = contracts.filter(c => c.status === 'drafted');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-32 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-32 bg-zinc-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-snow/60">Pending Signature</p>
                <p className="text-2xl font-bold text-snow">{pendingContracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-snow/60">Signed</p>
                <p className="text-2xl font-bold text-snow">{signedContracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-snow/60">Total Value</p>
                <p className="text-2xl font-bold text-snow">
                  ${signedContracts.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-snow/60">Total Contracts</p>
                <p className="text-2xl font-bold text-snow">{contracts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-zinc-900 border-zinc-800">
          <TabsTrigger value="pending" className="data-[state=active]:bg-purple-500">
            Pending ({pendingContracts.length})
          </TabsTrigger>
          <TabsTrigger value="signed" className="data-[state=active]:bg-purple-500">
            Signed ({signedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-500">
            All Contracts ({contracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingContracts.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-snow/30" />
                <h3 className="text-lg font-medium text-snow mb-2">No pending contracts</h3>
                <p className="text-snow/60">All contracts have been signed or are in draft.</p>
              </CardContent>
            </Card>
          ) : (
            pendingContracts.map((contract) => (
              <ContractCard 
                key={contract.id} 
                contract={contract} 
                onView={setSelectedContract}
                onSign={handleSignContract}
                onDownload={downloadContract}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="signed" className="space-y-4">
          {signedContracts.map((contract) => (
            <ContractCard 
              key={contract.id} 
              contract={contract} 
              onView={setSelectedContract}
              onDownload={downloadContract}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {contracts.map((contract) => (
            <ContractCard 
              key={contract.id} 
              contract={contract} 
              onView={setSelectedContract}
              onSign={contract.status === 'sent' ? handleSignContract : undefined}
              onDownload={downloadContract}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Contract Details Modal */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-snow">Contract Details</DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedContract.brand_logo} alt={selectedContract.brand_name} />
                    <AvatarFallback className="bg-purple-500 text-white">
                      {selectedContract.brand_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-snow">{selectedContract.campaign_name}</h3>
                    <p className="text-snow/60">{selectedContract.brand_name}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedContract.status)}>
                  {getStatusIcon(selectedContract.status)}
                  <span className="ml-1">{selectedContract.status}</span>
                </Badge>
              </div>

              {/* Contract Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-snow/60">Contract Value</p>
                  <p className="text-xl font-semibold text-snow">${selectedContract.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-snow/60">Created</p>
                  <p className="text-snow">{new Date(selectedContract.created_at).toLocaleDateString()}</p>
                </div>
                {selectedContract.signed_at && (
                  <>
                    <div>
                      <p className="text-sm text-snow/60">Signed Date</p>
                      <p className="text-snow">{new Date(selectedContract.signed_at).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Contract Terms */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-snow">Contract Terms</h4>
                
                <div>
                  <p className="text-sm text-snow/60 mb-2">Deliverables</p>
                  <div className="space-y-1">
                    {selectedContract.contract_data.deliverables?.map((deliverable: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-snow">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-snow/60">Payment Terms</p>
                    <p className="text-snow">{selectedContract.contract_data.payment_terms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-snow/60">Usage Rights</p>
                    <p className="text-snow">{selectedContract.contract_data.usage_rights}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-snow/60">Exclusivity</p>
                  <p className="text-snow">{selectedContract.contract_data.exclusivity}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                {selectedContract.status === 'sent' && (
                  <Button
                    onClick={() => handleSignContract(selectedContract.id)}
                    disabled={isSigningContract}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    {isSigningContract ? 'Signing...' : 'Sign Contract'}
                  </Button>
                )}
                
                {selectedContract.pdf_url && (
                  <Button
                    variant="outline"
                    onClick={() => downloadContract(selectedContract.id, selectedContract.campaign_name || 'Contract')}
                    className="border-zinc-700 text-snow hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Contract Card Component
interface ContractCardProps {
  contract: Contract;
  onView: (contract: Contract) => void;
  onSign?: (contractId: string) => void;
  onDownload: (contractId: string, contractName: string) => void;
}

const ContractCard = ({ contract, onView, onSign, onDownload }: ContractCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'drafted':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'sent':
        return <Clock className="h-4 w-4" />;
      case 'drafted':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contract.brand_logo} alt={contract.brand_name} />
              <AvatarFallback className="bg-purple-500 text-white">
                {contract.brand_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-semibold text-snow">{contract.campaign_name}</h3>
                <Badge className={getStatusColor(contract.status)}>
                  {getStatusIcon(contract.status)}
                  <span className="ml-1">{contract.status}</span>
                </Badge>
              </div>
              <p className="text-snow/60 mb-2">{contract.brand_name}</p>
              <div className="flex items-center space-x-4 text-sm text-snow/60">
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  ${contract.amount?.toLocaleString()}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(contract.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(contract)}
              className="border-zinc-700 text-snow hover:bg-zinc-800"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {contract.status === 'sent' && onSign && (
              <Button
                size="sm"
                onClick={() => onSign(contract.id)}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Sign
              </Button>
            )}
            
            {contract.pdf_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload(contract.id, contract.campaign_name || 'Contract')}
                className="border-zinc-700 text-snow hover:bg-zinc-800"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorContracts;
