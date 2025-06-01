
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Users, Clock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewContractModal } from '@/components/NewContractModal';
import { supabase } from '@/integrations/supabase/client';

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  brand_user_id: string;
  status: string;
  contract_data: any;
  created_at: string;
  signed_at?: string;
  // Joined data
  campaign?: { name: string };
  influencer?: { name: string };
}

const ContractsManager = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            *,
            campaigns(name),
            influencers(name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContracts(data || []);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast({
          title: "Error loading contracts",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'drafted':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending_signature':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'signed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'drafted':
        return 'Drafted';
      case 'pending_signature':
        return 'Pending Signature';
      case 'signed':
        return 'Signed';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleCreateContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'pending_signature' })
        .eq('id', contractId);

      if (error) throw error;

      setContracts(prev =>
        prev.map(contract =>
          contract.id === contractId
            ? { ...contract, status: 'pending_signature' }
            : contract
        )
      );
      
      toast({
        title: "Contract created",
        description: "Contract has been created and sent for signature.",
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to update contract status.",
        variant: "destructive",
      });
    }
  };

  const handleMoveToPayments = (contract: Contract) => {
    toast({
      title: "Moved to payments",
      description: `Contract for ${contract.influencer?.name || 'Unknown'} has been added to pending payments.`,
    });
  };

  // Calculate summary stats
  const stats = {
    total: contracts.length,
    drafted: contracts.filter(c => c.status === 'drafted').length,
    pending: contracts.filter(c => c.status === 'pending_signature').length,
    signed: contracts.filter(c => c.status === 'signed').length,
    totalBudget: contracts.reduce((sum, c) => {
      const amount = c.contract_data?.amount || 0;
      return sum + Number(amount);
    }, 0)
  };

  const handleCreateNewContract = (chatId: string, contractData: any) => {
    console.log('Creating contract for chat:', chatId, contractData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Drafted</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{stats.drafted}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Signed</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{stats.signed}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">${stats.totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-snow">Contract Management</CardTitle>
            <Button
              onClick={() => setNewContractModalOpen(true)}
              className="bg-coral hover:bg-coral/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700">
                <TableHead className="text-snow/80">Campaign</TableHead>
                <TableHead className="text-snow/80">Influencer</TableHead>
                <TableHead className="text-snow/80">Amount</TableHead>
                <TableHead className="text-snow/80">Status</TableHead>
                <TableHead className="text-snow/80">Created</TableHead>
                <TableHead className="text-snow/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-snow/60">
                    No contracts found. Create your first contract to get started.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-zinc-700 hover:bg-zinc-700/50">
                    <TableCell className="font-medium text-snow">
                      {contract.campaign?.name || 'Unknown Campaign'}
                    </TableCell>
                    <TableCell className="text-snow/80">
                      {contract.influencer?.name || 'Unknown Influencer'}
                    </TableCell>
                    <TableCell className="text-snow/80">
                      ${Number(contract.contract_data?.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-snow/80">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {contract.status === 'drafted' && (
                          <Button
                            onClick={() => handleCreateContract(contract.id)}
                            variant="ghost"
                            size="sm"
                            className="text-snow/70 hover:text-coral hover:bg-coral/10"
                          >
                            Send for Signature
                          </Button>
                        )}
                        {contract.status === 'signed' && (
                          <Button
                            onClick={() => handleMoveToPayments(contract)}
                            variant="ghost"
                            size="sm"
                            className="text-snow/70 hover:text-green-500 hover:bg-green-500/10"
                          >
                            Move to Payments
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-snow/70 hover:text-coral hover:bg-coral/10"
                        >
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewContractModal
        open={newContractModalOpen}
        onOpenChange={setNewContractModalOpen}
        onCreateContract={handleCreateNewContract}
      />
    </div>
  );
};

export default ContractsManager;
