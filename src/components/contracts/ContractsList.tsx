import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [open, setOpen] = useState(false);
  const [fee, setFee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [templateId, setTemplateId] = useState('');

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

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => setFee(e.target.value);
  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value);
  const handleTemplateIdChange = (e: React.ChangeEvent<HTMLInputElement>) => setTemplateId(e.target.value);
  const handleCreateContract = () => {
    // For local contracts, just show a toast and close dialog (or implement localStorage logic if needed)
    toast({ title: 'Create Contract', description: 'This would create a contract (implement logic as needed).' });
    setFee('');
    setDeadline('');
    setTemplateId('');
    setOpen(false);
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="text-gray-900 flex items-center">
            <FileText className="mr-2 h-5 w-5 text-coral" />
            Local Contracts ({contracts.length})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpen} size="sm" className="ml-2 bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4 mr-1" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Contract</DialogTitle>
                <DialogDescription>
                  Create a new contract for an influencer.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fee" className="text-right">
                    Fee
                  </Label>
                  <Input id="fee" value={fee} onChange={handleFeeChange} className="col-span-3" type="number" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deadline" className="text-right">
                    Deadline
                  </Label>
                  <Input id="deadline" value={deadline} onChange={handleDeadlineChange} className="col-span-3" type="date" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="templateId" className="text-right">
                    Template ID
                  </Label>
                  <Input id="templateId" value={templateId} onChange={handleTemplateIdChange} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateContract} className="bg-coral hover:bg-coral/90 text-white">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Contract Name</TableHead>
              <TableHead className="text-gray-600">Created</TableHead>
              <TableHead className="text-gray-600">Status</TableHead>
              <TableHead className="text-gray-600 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No contracts found. Create your first contract to get started.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.contract.id} className="border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-gray-900 font-medium">
                    {contract.fileName}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(contract.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-coral/10 text-coral border-coral/20">
                      {contract.contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleView(contract)}
                      className="text-gray-600 hover:text-coral hover:bg-coral/10"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(contract)}
                      className="text-gray-600 hover:text-coral hover:bg-coral/10"
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