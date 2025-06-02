import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { PaymentList } from './PaymentList';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  campaign?: {
    name: string;
    brand: string;
  };
  influencer?: {
    name: string;
    handle: string;
    platform: string;
    avatar_url?: string;
  };
}

interface PaymentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentManager = ({ isOpen, onClose }: PaymentManagerProps) => {
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('milestone');

  // Fetch contracts with campaign and influencer details
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts-with-details'],
    queryFn: async () => {
      // First fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'ACCEPTED');

      if (contractsError) throw contractsError;
      if (!contractsData) return [];

      // Fetch related data for each contract
      const contractsWithDetails = await Promise.all(
        contractsData.map(async (contract) => {
          // Get campaign details
          const { data: campaignData } = await supabase
            .from('campaigns')
            .select('name, brand')
            .eq('id', contract.campaign_id)
            .single();

          // Get influencer details
          const { data: influencerData } = await supabase
            .from('influencers')
            .select('name, handle, platform, avatar_url')
            .eq('id', contract.influencer_id)
            .single();

          return {
            ...contract,
            campaign: campaignData || { name: 'Unknown Campaign', brand: 'Unknown Brand' },
            influencer: influencerData || { name: 'Unknown Influencer', handle: '', platform: '', avatar_url: '' }
          };
        })
      );

      return contractsWithDetails as Contract[];
    },
  });

  const handleContractSelect = (contractId: string) => {
    setSelectedContract(contractId);
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      setAmount(contract.contract_data.fee.toString());
    }
  };

  const handleCreatePayment = async () => {
    if (!selectedContract || !amount) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const contract = contracts.find(c => c.id === selectedContract);
      if (!contract) throw new Error('Contract not found');

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          campaign_id: contract.campaign_id,
          influencer_id: contract.influencer_id,
          brand_user_id: "d0d7d0d7-d0d7-d0d7-d0d7-d0d7d0d7d0d7",
          amount: parseFloat(amount),
          payment_type: paymentType,
          status: 'pending',
          milestone_description: `Payment for campaign: ${contract.campaign?.name}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Payment Created",
        description: "The payment has been created successfully",
      });

      setSelectedContract('');
      setAmount('');
      setPaymentType('milestone');
      onClose();

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-snow sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Payment</DialogTitle>
          <DialogDescription className="text-snow/60">
            Select a contract and enter payment details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Selection */}
          <div className="space-y-2">
            <Label>Select Contract</Label>
            {contractsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-4 text-snow/60">
                No accepted contracts found. Please wait for influencers to accept contracts.
              </div>
            ) : (
              <RadioGroup value={selectedContract} onValueChange={handleContractSelect}>
                <div className="space-y-4">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                        selectedContract === contract.id
                          ? 'bg-coral/10 border-coral'
                          : 'bg-zinc-800 border-zinc-700 hover:border-coral/50'
                      }`}
                    >
                      <RadioGroupItem value={contract.id} id={contract.id} />
                      <div className="flex items-center flex-1 space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contract.influencer?.avatar_url} />
                          <AvatarFallback>{contract.influencer?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Label htmlFor={contract.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{contract.influencer?.name}</div>
                          <div className="text-sm text-snow/60">
                            {contract.campaign?.name}
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {selectedContract && (
            <>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="Enter amount"
                />
                {contracts.find(c => c.id === selectedContract)?.contract_data.fee && (
                  <div className="text-sm text-snow/60">
                    Default amount: {formatCurrency(contracts.find(c => c.id === selectedContract)?.contract_data.fee || 0)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select disabled value="INR">
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue>INR (₹)</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone Payment</SelectItem>
                    <SelectItem value="full">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePayment}
                  disabled={isCreating || !amount}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Create Payment'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 