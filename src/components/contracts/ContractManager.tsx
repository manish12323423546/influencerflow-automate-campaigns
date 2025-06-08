import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Send, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Contract, ContractData } from '@/lib/agents/types';

interface Campaign {
  id: string;
  name: string;
  brand: string;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  avatar_url: string;
}

interface ContractWithDetails extends Contract {
  campaigns?: Campaign;
  influencers?: Influencer;
}

interface ContractManagerProps {
  campaignId?: string;
  influencerId?: string;
}

export const ContractManager: React.FC<ContractManagerProps> = ({ campaignId, influencerId }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [fee, setFee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    fetchContracts();
  }, [user, campaignId, influencerId]);

  const fetchContracts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('contracts')
        .select(`
        *,
        campaigns!inner(id, name, brand),
        influencers!inner(id, name, handle, platform, avatar_url)
      `)
        .eq('brand_user_id', user.id)
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      if (influencerId) {
        query = query.eq('influencer_id', influencerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedContracts = data?.map(contract => {
        let contractData: ContractData;
        try {
          if (typeof contract.contract_data === 'string') {
            contractData = JSON.parse(contract.contract_data);
          } else if (
            contract.contract_data &&
            typeof contract.contract_data === 'object' &&
            !Array.isArray(contract.contract_data)
          ) {
            contractData = contract.contract_data as unknown as ContractData;
          } else {
            contractData = {
              fee: 0,
              deadline: '',
              template_id: '',
              generated_at: new Date().toISOString()
            };
          }
        } catch {
          contractData = {
            fee: 0,
            deadline: '',
            template_id: '',
            generated_at: new Date().toISOString()
          };
        }

        return {
          ...contract,
          contract_data: contractData,
          status: contract.status as Contract['status'],
          campaigns: Array.isArray(contract.campaigns) ? contract.campaigns[0] : contract.campaigns,
          influencers: Array.isArray(contract.influencers) ? contract.influencers[0] : contract.influencers
        };
      }) || [];

      setContracts(transformedContracts as ContractWithDetails[]);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleEditOpen = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setFee(contract.contract_data.fee.toString());
    setDeadline(contract.contract_data.deadline);
    setTemplateId(contract.contract_data.template_id);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedContract(null);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFee(e.target.value);
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadline(e.target.value);
  };

  const handleTemplateIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateId(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedContract) return;

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          contract_data: {
            fee: parseFloat(fee),
            deadline: deadline,
            template_id: templateId,
            generated_at: new Date().toISOString()
          }
        })
        .eq('id', selectedContract.id);

      if (error) throw error;

      toast.success('Contract updated successfully');
      fetchContracts();
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    } finally {
      handleEditClose();
    }
  };

  const handleDelete = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      toast.success('Contract deleted successfully');
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('Failed to delete contract');
    }
  };

  const downloadContract = (contract: ContractWithDetails) => {
    if (contract.pdf_url) {
      window.open(contract.pdf_url, '_blank');
    } else {
      toast.error('PDF not available for this contract');
    }
  };

  const handleCreateContract = async () => {
    if (!fee || !deadline || !templateId) {
      toast.error('Please fill all fields');
      return;
    }
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const { error } = await supabase
        .from('contracts')
        .insert({
          brand_user_id: user.id,
          campaign_id: campaignId,
          influencer_id: influencerId,
          contract_data: {
            fee: parseFloat(fee),
            deadline: deadline,
            template_id: templateId,
            generated_at: new Date().toISOString()
          },
          status: 'draft',
        });
      if (error) throw error;
      toast.success('Contract created successfully');
      setFee('');
      setDeadline('');
      setTemplateId('');
      setOpen(false);
      fetchContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contracts</h2>
          <p className="text-muted-foreground">Manage your contracts with influencers</p>
        </div>
        <Button onClick={handleOpen} className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contracts.map((contract) => (
          <Card key={contract.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Contract #{contract.id.substring(0, 8)}</span>
              </CardTitle>
              <CardDescription>
                {contract.campaigns?.name} - {contract.campaigns?.brand}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Influencer:</span>
                <span className="text-sm">{contract.influencers?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fee:</span>
                <span className="text-sm font-bold">${contract.contract_data.fee}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-coral/10 text-coral border-coral/20">{contract.status}</Badge>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => downloadContract(contract)} className="border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="border-coral text-coral hover:bg-coral hover:text-white transition-all duration-300">
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditOpen(contract)} className="text-gray-600 hover:text-coral hover:bg-coral/10 transition-all duration-300">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(contract.id)} className="bg-red-500 hover:bg-red-600 text-white transition-all duration-300">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add Contract</Button>
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
            <Button type="submit" onClick={handleCreateContract}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Make changes to the contract details.
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
            <Button type="submit" onClick={handleSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
