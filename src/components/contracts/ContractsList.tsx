import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  contract_data: {
    fee: number;
    deadline: string;
    template_id: string;
    generated_at: string;
  };
  status: string;
  created_at: string;
}

interface StoredContract {
  pdfBase64: string;
  fileName: string;
  contract: Contract;
  timestamp: string;
  campaignName?: string;
  influencerName?: string;
}

const ContractsList = () => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<StoredContract[]>([]);

  // Load contracts from localStorage
  useEffect(() => {
    const loadContracts = () => {
      const storedContracts: StoredContract[] = [];
      
      // Iterate through localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('contract_')) {
          try {
            const contractData = JSON.parse(localStorage.getItem(key) || '');
            storedContracts.push(contractData);
          } catch (error) {
            console.error('Error parsing contract:', error);
          }
        }
      }

      // Sort by timestamp, newest first
      storedContracts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setContracts(storedContracts);
    };

    loadContracts();

    // Add event listener for storage changes
    window.addEventListener('storage', loadContracts);
    return () => window.removeEventListener('storage', loadContracts);
  }, []);

  const handleDownload = (contract: StoredContract) => {
    try {
      // Create text content from base64
      const content = decodeURIComponent(escape(atob(contract.pdfBase64)));
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = contract.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your contract is being downloaded.",
      });
    } catch (error) {
      console.error('Error downloading contract:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the contract",
        variant: "destructive",
      });
    }
  };

  const handleView = (contract: StoredContract) => {
    try {
      // Create text content from base64
      const content = decodeURIComponent(escape(atob(contract.pdfBase64)));
      
      // Create blob and open in new tab
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast({
        title: "Error",
        description: "Failed to open the contract",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-snow flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Local Contracts ({contracts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700">
              <TableHead className="text-snow/80">Contract Name</TableHead>
              <TableHead className="text-snow/80">Created</TableHead>
              <TableHead className="text-snow/80">Status</TableHead>
              <TableHead className="text-snow/80 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-snow/60 py-8">
                  No contracts found. Create your first contract to get started.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.contract.id} className="border-zinc-700">
                  <TableCell className="text-snow">
                    {contract.fileName}
                  </TableCell>
                  <TableCell className="text-snow">
                    {new Date(contract.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      {contract.contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(contract)}
                      className="hover:bg-purple-500/20 hover:text-purple-500"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(contract)}
                      className="hover:bg-purple-500/20 hover:text-purple-500"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ContractsList; 