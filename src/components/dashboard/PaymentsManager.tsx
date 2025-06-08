import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Clock, CheckCircle, XCircle, DollarSign, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentManager } from '@/components/payments/PaymentManager';
import RazorpayPayment from '@/components/payments/RazorpayPayment';

interface Payment {
  id: string;
  campaign_id: string;
  influencer_id: string;
  brand_user_id: string;
  amount: number;
  status: string;
  payment_type: string;
  created_at: string;
  paid_at?: string;
  milestone_description?: string;
  // Joined data
  campaign?: { name: string };
  influencer?: { name: string };
}

const PaymentsManager = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentManager, setShowPaymentManager] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRazorpayDialog, setShowRazorpayDialog] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        // First fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;
        if (!paymentsData) return;

        // Fetch related data for each payment
        const paymentsWithDetails = await Promise.all(
          paymentsData.map(async (payment) => {
            // Get campaign details
            const { data: campaignData } = await supabase
              .from('campaigns')
              .select('name')
              .eq('id', payment.campaign_id)
              .single();

            // Get influencer details
            const { data: influencerData } = await supabase
              .from('influencers')
              .select('name')
              .eq('id', payment.influencer_id)
              .single();

            return {
              ...payment,
              campaign: campaignData || { name: 'Unknown Campaign' },
              influencer: influencerData || { name: 'Unknown Influencer' }
            };
          })
        );

        setPayments(paymentsWithDetails);
      } catch (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error loading payments",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayments();
  }, [toast]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Calculate summary stats
  const paymentStats = {
    pending: payments.filter(p => p.status === 'pending').length,
    processing: payments.filter(p => p.status === 'processing').length,
    completed: payments.filter(p => p.status === 'completed').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    totalCompleted: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0)
  };

  const pendingPayments = payments.filter(p => ['pending', 'processing'].includes(p.status));
  const completedPayments = payments.filter(p => ['completed', 'failed'].includes(p.status));

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paymentStats.pending}</div>
            <p className="text-xs text-gray-500">₹{paymentStats.totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paymentStats.processing}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paymentStats.completed}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{paymentStats.failed}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₹{paymentStats.totalCompleted.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* New Payment Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowPaymentManager(true)}
          className="bg-coral hover:bg-coral/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Payment
        </Button>
      </div>

      {/* Tabs for Payments and Transactions */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-white border border-gray-200 shadow-sm">
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-coral data-[state=active]:text-white text-gray-600 hover:text-gray-900 transition-colors"
          >
            Pending Payments
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-coral data-[state=active]:text-white text-gray-600 hover:text-gray-900 transition-colors"
          >
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Campaign</TableHead>
                    <TableHead className="text-gray-600">Influencer</TableHead>
                    <TableHead className="text-gray-600">Amount</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Created</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No pending payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {payment.campaign?.name || 'Unknown Campaign'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {payment.influencer?.name || 'Unknown Influencer'}
                        </TableCell>
                        <TableCell className="text-gray-600">₹{Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            {payment.payment_type || 'milestone'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-coral hover:bg-coral/90 text-white"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowRazorpayDialog(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          {payment.status === 'processing' && (
                            <span className="text-sm text-gray-500">Processing...</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Campaign</TableHead>
                    <TableHead className="text-gray-600">Influencer</TableHead>
                    <TableHead className="text-gray-600">Amount</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Paid At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No transaction history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-gray-200 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {payment.campaign?.name || 'Unknown Campaign'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {payment.influencer?.name || 'Unknown Influencer'}
                        </TableCell>
                        <TableCell className="text-gray-600">₹{Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            {payment.payment_type || 'payment'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Manager Modal */}
      <PaymentManager 
        isOpen={showPaymentManager}
        onClose={() => setShowPaymentManager(false)}
      />

      {/* RazorPay Payment Dialog */}
      {selectedPayment && (
        <RazorpayPayment
          isOpen={showRazorpayDialog}
          onClose={() => {
            setShowRazorpayDialog(false);
            setSelectedPayment(null);
          }}
          onSuccess={() => {
            // Refresh payments list
            window.location.reload();
          }}
          amount={selectedPayment.amount}
          description={selectedPayment.milestone_description || `Payment for ${selectedPayment.campaign?.name}`}
          campaignId={selectedPayment.campaign_id}
          influencerId={selectedPayment.influencer_id}
        />
      )}
    </div>
  );
};

export default PaymentsManager;
