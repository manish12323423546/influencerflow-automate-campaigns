
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Calendar, User, FileText, Building, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ContractData } from '@/lib/agents/types';
import { SecurePaymentForm } from './SecurePaymentForm';

interface Campaign {
  name: string;
  brand: string;
}

interface Influencer {
  name: string;
  handle: string;
  platform: string;
  avatar_url: string;
}

interface Contract {
  id: string;
  contract_data: ContractData;
  campaign: Campaign;
  influencer: Influencer;
  created_at: string;
  status: string;
}

interface PaymentManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const PaymentManager: React.FC<PaymentManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecurePayment, setShowSecurePayment] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [user]);

  const fetchContracts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
        *,
        campaigns!inner(name, brand),
        influencers!inner(name, handle, platform, avatar_url)
      `)
        .eq('brand_user_id', user.id)
        .eq('status', 'ACCEPTED')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedContracts = data?.map(contract => {
        let contractData: ContractData;
        try {
          if (typeof contract.contract_data === 'string') {
            contractData = JSON.parse(contract.contract_data);
          } else if (contract.contract_data && typeof contract.contract_data === 'object') {
            contractData = contract.contract_data as ContractData;
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
          campaign: Array.isArray(contract.campaigns) ? contract.campaigns[0] : contract.campaigns,
          influencer: Array.isArray(contract.influencers) ? contract.influencers[0] : contract.influencers
        };
      }) || [];

      setContracts(transformedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurePayment = (contract: Contract) => {
    setSelectedContract(contract);
    setShowSecurePayment(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment processed successfully');
    setShowSecurePayment(false);
    setSelectedContract(null);
    fetchContracts(); // Refresh the contracts list
  };

  if (loading) {
    return <div>Loading contracts...</div>;
  }

  if (showSecurePayment && selectedContract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowSecurePayment(false)}
          >
            ← Back to Contracts
          </Button>
        </div>
        <SecurePaymentForm
          campaignId={selectedContract.campaign.name}
          influencerId={selectedContract.influencer.name}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Secure Payment Management</h2>
          <p className="text-muted-foreground flex items-center space-x-1">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Manage payments for accepted contracts securely</span>
          </p>
        </div>
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
                {contract.campaign?.name} - {contract.campaign?.brand}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{contract.influencer?.name} (@{contract.influencer?.handle})</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Amount: ₹{contract.contract_data.fee}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Deadline: {new Date(contract.contract_data.deadline).toLocaleDateString()}</span>
              </div>
              <div>
                <Badge variant="outline" className="bg-coral/10 text-coral border-coral/20">{contract.status}</Badge>
              </div>
              <Button
                onClick={() => handleSecurePayment(contract)}
                className="w-full bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Shield className="w-4 h-4 mr-2" />
                Secure Payment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
