import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, CreditCard, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ContractData {
  fee: number;
  deadline: string;
  template_id: string;
  generated_at: string;
}

interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  contract_data: ContractData;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  campaign: { name: string; brand: string; };
  influencer: { name: string; handle: string; platform: string; avatar_url: string; };
}

export const PaymentManager: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          *,
          campaigns!inner(name, brand),
          influencers!inner(name, handle, platform, avatar_url)
        `)
        .eq('brand_user_id', user.id)
        .eq('status', 'ACCEPTED');

      if (contractsError) throw contractsError;

      // Transform contracts data
      const transformedContracts = contractsData?.map(contract => ({
        ...contract,
        contract_data: contract.contract_data as ContractData || {
          fee: 0,
          deadline: '',
          template_id: '',
          generated_at: contract.created_at
        },
        campaign: Array.isArray(contract.campaigns) ? contract.campaigns[0] : contract.campaigns,
        influencer: Array.isArray(contract.influencers) ? contract.influencers[0] : contract.influencers
      })) || [];

      setContracts(transformedContracts as Contract[]);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('brand_user_id', user.id);

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch payment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const calculatePendingPayments = () => {
    return contracts.filter(contract => contract.status === 'SENT').length;
  };

  const calculateCompletedContracts = () => {
    return contracts.filter(contract => contract.status === 'COMPLETED').length;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">Manage payments and milestones for your campaigns</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Total Revenue</span>
                </CardTitle>
                <CardDescription>Total payments received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${calculateTotalRevenue().toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Pending Payments</span>
                </CardTitle>
                <CardDescription>Contracts awaiting payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculatePendingPayments()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Completed Contracts</span>
                </CardTitle>
                <CardDescription>Contracts successfully completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateCompletedContracts()}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="contracts" className="space-y-4">
          {contracts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardHeader>
                    <CardTitle>{contract.campaign?.name}</CardTitle>
                    <CardDescription>
                      Contract with {contract.influencer?.name} ({contract.influencer?.handle})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Fee: ${contract.contract_data?.fee}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Deadline: {contract.contract_data?.deadline}
                    </div>
                    <Badge variant="secondary">{contract.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No contracts found.</p>
          )}
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          {payments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardHeader>
                    <CardTitle>Payment for {payment.milestone_description}</CardTitle>
                    <CardDescription>
                      Payment of ${payment.amount}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Created At: {payment.created_at}
                    </div>
                    <Badge variant="outline">{payment.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No payments found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
