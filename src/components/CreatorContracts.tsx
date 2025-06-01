import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Eye, Download, Clock, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Contract {
  id: string;
  campaign_id: string;
  campaign_name: string;
  brand_name: string;
  brand_logo: string;
  amount: number;
  status: 'completed' | 'drafted' | 'sent' | 'signed';
  created_at: string;
  signed_at?: string;
  pdf_url?: string;
}

const CreatorContracts = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed'>('all');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['creator-contracts'],
    queryFn: async () => {
      console.log('Fetching creator contracts from Supabase...');
      
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          *,
          campaigns (
            id,
            name,
            brand
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      // Transform the data to match our interface
      return contractsData?.map(contract => {
        let amount = 0;
        
        // Safely extract amount from contract_data JSON
        if (contract.contract_data && typeof contract.contract_data === 'object') {
          const contractDataObj = contract.contract_data as any;
          amount = contractDataObj.amount || contractDataObj.fee || 0;
        }

        // Ensure status is one of the allowed types
        const validStatuses = ['completed', 'drafted', 'sent', 'signed'] as const;
        const status = validStatuses.includes(contract.status as any) 
          ? contract.status as 'completed' | 'drafted' | 'sent' | 'signed'
          : 'drafted';

        return {
          id: contract.id,
          campaign_id: contract.campaign_id || '',
          campaign_name: contract.campaigns?.name || 'Unknown Campaign',
          brand_name: contract.campaigns?.brand || 'Unknown Brand',
          brand_logo: '/placeholder.svg',
          amount: Number(amount),
          status,
          created_at: contract.created_at,
          signed_at: contract.signed_at,
          pdf_url: contract.pdf_url,
        };
      }) || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-500/10 text-green-500';
      case 'sent':
        return 'bg-blue-500/10 text-blue-500';
      case 'drafted':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'completed':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (filter === 'pending') return ['drafted', 'sent'].includes(contract.status);
    if (filter === 'signed') return ['signed', 'completed'].includes(contract.status);
    return true;
  });

  const handleDownload = (pdfUrl?: string) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "PDF not available",
        description: "This contract doesn't have a PDF version yet.",
        variant: "destructive",
      });
    }
  };

  const getPendingContracts = () => {
    return contracts.filter(c => ['drafted', 'sent'].includes(c.status)).length;
  };

  const getSignedContracts = () => {
    return contracts.filter(c => ['signed', 'completed'].includes(c.status)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-snow">My Contracts</h2>
          <p className="text-snow/60">View and manage your campaign contracts</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'all' ? 'bg-purple-500 hover:bg-purple-600' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
          >
            All ({contracts.length})
          </Button>
          <Button
            onClick={() => setFilter('pending')}
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'pending' ? 'bg-purple-500 hover:bg-purple-600' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
          >
            Pending ({getPendingContracts()})
          </Button>
          <Button
            onClick={() => setFilter('signed')}
            variant={filter === 'signed' ? 'default' : 'outline'}
            size="sm"
            className={filter === 'signed' ? 'bg-purple-500 hover:bg-purple-600' : 'border-zinc-700 text-snow hover:bg-zinc-800'}
          >
            Signed ({getSignedContracts()})
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-snow/70 text-sm font-medium mb-2">Total Contracts</h3>
          <p className="text-3xl font-bold text-snow">{contracts.length}</p>
          <p className="text-blue-500 text-sm mt-1">All time</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-snow/70 text-sm font-medium mb-2">Pending Review</h3>
          <p className="text-3xl font-bold text-snow">{getPendingContracts()}</p>
          <p className="text-yellow-500 text-sm mt-1">Awaiting signature</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-snow/70 text-sm font-medium mb-2">Signed</h3>
          <p className="text-3xl font-bold text-snow">{getSignedContracts()}</p>
          <p className="text-green-500 text-sm mt-1">Active contracts</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-snow/30" />
            <h3 className="text-lg font-medium text-snow mb-2">
              {filter === 'all' ? 'No contracts yet' : `No ${filter} contracts`}
            </h3>
            <p className="text-snow/60">
              {filter === 'all' 
                ? 'Your campaign contracts will appear here once brands send them.'
                : `You don't have any ${filter} contracts at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-snow">
              {filter === 'all' ? 'All Contracts' : 
               filter === 'pending' ? 'Pending Contracts' : 'Signed Contracts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-snow/80">Campaign</TableHead>
                  <TableHead className="text-snow/80">Brand</TableHead>
                  <TableHead className="text-snow/80">Amount</TableHead>
                  <TableHead className="text-snow/80">Status</TableHead>
                  <TableHead className="text-snow/80">Created</TableHead>
                  <TableHead className="text-snow/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="border-zinc-700 hover:bg-zinc-700/50">
                    <TableCell className="font-medium text-snow">
                      {contract.campaign_name}
                    </TableCell>
                    <TableCell className="text-snow/80">
                      {contract.brand_name}
                    </TableCell>
                    <TableCell className="text-snow/80">
                      ${contract.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-snow/80">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-600 text-snow/70 hover:bg-zinc-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {contract.pdf_url && (
                          <Button
                            onClick={() => handleDownload(contract.pdf_url)}
                            variant="outline"
                            size="sm"
                            className="border-zinc-600 text-snow/70 hover:bg-zinc-700"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreatorContracts;
