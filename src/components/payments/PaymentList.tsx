import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, User, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  contract_id: string;
  contract_status: string;
  milestone_description: string;
  campaigns: { name: string; brand: string; };
  influencers: { name: string; handle: string; };
}

export const PaymentList: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [user]);
  
  // Add event listener for payment refresh events
  useEffect(() => {
    const handlePaymentsRefresh = () => {
      console.log('Payment refresh event received in PaymentList');
      fetchPayments();
    };
    
    // Listen for the custom event dispatched when payments are updated
    window.addEventListener('paymentsRefresh', handlePaymentsRefresh);
    
    // Also listen for contract status changes
    const contractStatusChannel = supabase
      .channel('payment-list-contract-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('Contract status changed:', payload);
          fetchPayments();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('paymentsRefresh', handlePaymentsRefresh);
      supabase.removeChannel(contractStatusChannel);
    };
  }, []);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      // Fetch payments with contract_status = 'ACCEPTED'
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          campaigns!inner(name, brand),
          influencers!inner(name, handle)
        `)
        .eq('brand_user_id', user.id)
        .eq('contract_status', 'ACCEPTED') // Only show payments for ACCEPTED contracts
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle potential array responses
      const transformedPayments = data?.map(payment => ({
        ...payment,
        campaigns: Array.isArray(payment.campaigns) ? payment.campaigns[0] : payment.campaigns,
        influencers: Array.isArray(payment.influencers) ? payment.influencers[0] : payment.influencers
      })) || [];

      console.log('Fetched payments with ACCEPTED contract_status:', transformedPayments.length);
      setPayments(transformedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payment information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Records</h2>
          <p className="text-muted-foreground">View and manage your payment history</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Records</h3>
            <p className="text-gray-600 mb-4 max-w-md">
              You don't have any payment records yet. Payment records are automatically created when contracts are accepted.
            </p>
            <p className="text-sm text-gray-500">
              Tip: Accept contracts to see payment records appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Payment #{payment.id.substring(0, 8)}</span>
                </CardTitle>
                <CardDescription>{payment.milestone_description || payment.campaigns?.name || 'Payment'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{payment.influencers?.name} (@{payment.influencers?.handle})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>{payment.campaigns?.brand || 'Brand'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Amount: ₹{payment.amount?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <Badge variant="secondary">{payment.status}</Badge>
                  {payment.contract_status && (
                    <Badge variant="outline" className="ml-2">{payment.contract_status}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
