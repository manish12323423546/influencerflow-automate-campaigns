import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, Users, Clock, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewContractModal } from '@/components/NewContractModal';

interface Contract {
  id: string;
  creatorName: string;
  campaignName: string;
  budget: number;
  deliverables: string[];
  status: 'negotiating' | 'pending_signature' | 'signed' | 'completed';
  createdDate: string;
  signedDate?: string;
}

const mockContracts: Contract[] = [
  {
    id: '1',
    creatorName: 'Sarah Johnson',
    campaignName: 'Tech Product Launch',
    budget: 2500,
    deliverables: ['3 Instagram Posts', '1 Reel', '5 Stories'],
    status: 'negotiating',
    createdDate: '2024-01-15'
  },
  {
    id: '2',
    creatorName: 'Mike Chen',
    campaignName: 'Fitness App Promotion',
    budget: 1800,
    deliverables: ['2 YouTube Videos', '3 Instagram Posts'],
    status: 'signed',
    createdDate: '2024-01-10',
    signedDate: '2024-01-12'
  },
  {
    id: '3',
    creatorName: 'Emma Style',
    campaignName: 'Fashion Summer Collection',
    budget: 2200,
    deliverables: ['4 Instagram Posts', '2 Reels', '10 Stories'],
    status: 'pending_signature',
    createdDate: '2024-01-12'
  }
];

const ContractsManager = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'negotiating':
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
      case 'negotiating':
        return 'Negotiating';
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

  const handleCreateContract = (contractId: string) => {
    setContracts(prev =>
      prev.map(contract =>
        contract.id === contractId
          ? { ...contract, status: 'pending_signature' as const }
          : contract
      )
    );
    
    toast({
      title: "Contract created",
      description: "Contract has been created and sent for signature.",
    });
  };

  const handleMoveToPayments = (contract: Contract) => {
    toast({
      title: "Moved to payments",
      description: `${contract.creatorName} has been added to pending payments.`,
    });
  };

  // Calculate summary stats
  const stats = {
    total: contracts.length,
    negotiating: contracts.filter(c => c.status === 'negotiating').length,
    pending: contracts.filter(c => c.status === 'pending_signature').length,
    signed: contracts.filter(c => c.status === 'signed').length,
    totalBudget: contracts.reduce((sum, c) => sum + c.budget, 0)
  };

  const handleCreateNewContract = (chatId: string, contractData: any) => {
    // Add logic to create new contract
    console.log('Creating contract for chat:', chatId, contractData);
  };

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
            <CardTitle className="text-sm font-medium text-snow/80">Negotiating</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{stats.negotiating}</div>
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
                <TableHead className="text-snow/80">Creator</TableHead>
                <TableHead className="text-snow/80">Campaign</TableHead>
                <TableHead className="text-snow/80">Budget</TableHead>
                <TableHead className="text-snow/80">Deliverables</TableHead>
                <TableHead className="text-snow/80">Status</TableHead>
                <TableHead className="text-snow/80">Created</TableHead>
                <TableHead className="text-snow/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id} className="border-zinc-700 hover:bg-zinc-700/50">
                  <TableCell className="font-medium text-snow">{contract.creatorName}</TableCell>
                  <TableCell className="text-snow/80">{contract.campaignName}</TableCell>
                  <TableCell className="text-snow/80">${contract.budget.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contract.deliverables.slice(0, 2).map((deliverable, index) => (
                        <Badge key={index} variant="outline" className="border-zinc-600 text-snow/70 text-xs">
                          {deliverable}
                        </Badge>
                      ))}
                      {contract.deliverables.length > 2 && (
                        <Badge variant="outline" className="border-zinc-600 text-snow/70 text-xs">
                          +{contract.deliverables.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contract.status)}>
                      {getStatusLabel(contract.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-snow/80">{contract.createdDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {contract.status === 'negotiating' && (
                        <Button
                          onClick={() => handleCreateContract(contract.id)}
                          variant="ghost"
                          size="sm"
                          className="text-snow/70 hover:text-coral hover:bg-coral/10"
                        >
                          Create Contract
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
              ))}
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
