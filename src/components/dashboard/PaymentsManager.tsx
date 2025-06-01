
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Clock, CheckCircle, XCircle, DollarSign, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const [showRazorpayPayment, setShowRazorpayPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            campaigns(name),
            influencers(name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPayments(data || []);
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

  const handlePayNow = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'processing',
          paid_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;

      setPayments(prev =>
        prev.map(payment =>
          payment.id === paymentId
            ? { ...payment, status: 'processing', paid_at: new Date().toISOString() }
            : payment
        )
      );

      const payment = payments.find(p => p.id === paymentId);
      toast({
        title: "Payment initiated",
        description: `Payment of $${payment?.amount} to ${payment?.influencer?.name || 'Unknown'} has been initiated.`,
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment.",
        variant: "destructive",
      });
    }
  };

  const handleRazorpayPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRazorpayPayment(true);
  };

  const handlePaymentSuccess = () => {
    // Refresh payments data
    window.location.reload();
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
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{paymentStats.pending}</div>
            <p className="text-xs text-neutral-400">${paymentStats.totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Processing</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{paymentStats.processing}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{paymentStats.completed}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">{paymentStats.failed}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">${paymentStats.totalCompleted.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* New Payment Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowRazorpayPayment(true)}
          className="bg-coral hover:bg-coral/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Payment
        </Button>
      </div>

      {/* Tabs for Payments and Transactions */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-zinc-800 border border-zinc-700">
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-coral data-[state=active]:text-white text-snow/80 hover:text-snow transition-colors"
          >
            Pending Payments
          </TabsTrigger>
          <TabsTrigger 
            value="transactions"
            className="data-[state=active]:bg-coral data-[state=active]:text-white text-snow/80 hover:text-snow transition-colors"
          >
            Transaction History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-snow">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-snow/80">Campaign</TableHead>
                    <TableHead className="text-snow/80">Influencer</TableHead>
                    <TableHead className="text-snow/80">Amount</TableHead>
                    <TableHead className="text-snow/80">Type</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Created</TableHead>
                    <TableHead className="text-snow/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-snow/60">
                        No pending payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-zinc-700 hover:bg-zinc-700/50">
                        <TableCell className="font-medium text-snow">
                          {payment.campaign?.name || 'Unknown Campaign'}
                        </TableCell>
                        <TableCell className="text-snow/80">
                          {payment.influencer?.name || 'Unknown Influencer'}
                        </TableCell>
                        <TableCell className="text-snow/80">${Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-zinc-600 text-snow/70">
                            {payment.payment_type || 'milestone'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-snow/80">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handlePayNow(payment.id)}
                                size="sm"
                                variant="outline"
                                className="border-zinc-600 text-snow/70 hover:bg-zinc-700"
                              >
                                Pay Now
                              </Button>
                              <Button
                                onClick={() => handleRazorpayPayment(payment)}
                                size="sm"
                                className="bg-coral hover:bg-coral/90 text-white"
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Razorpay
                              </Button>
                            </div>
                          )}
                          {payment.status === 'processing' && (
                            <span className="text-sm text-snow/60">Processing...</span>
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
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-snow">Transaction History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-snow/80">Campaign</TableHead>
                    <TableHead className="text-snow/80">Influencer</TableHead>
                    <TableHead className="text-snow/80">Amount</TableHead>
                    <TableHead className="text-snow/80">Type</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-snow/60">
                        No transaction history found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-zinc-700 hover:bg-zinc-700/50">
                        <TableCell className="font-medium text-snow">
                          {payment.campaign?.name || 'Unknown Campaign'}
                        </TableCell>
                        <TableCell className="text-snow/80">
                          {payment.influencer?.name || 'Unknown Influencer'}
                        </TableCell>
                        <TableCell className="text-snow/80">${Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-zinc-600 text-snow/70">
                            {payment.payment_type || 'payment'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-snow/80">
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

      {/* Razorpay Payment Modal */}
      <RazorpayPayment
        isOpen={showRazorpayPayment}
        onClose={() => {
          setShowRazorpayPayment(false);
          setSelectedPayment(null);
        }}
        onSuccess={handlePaymentSuccess}
        campaignId={selectedPayment?.campaign_id}
        influencerId={selectedPayment?.influencer_id}
        amount={selectedPayment?.amount}
        description={selectedPayment?.milestone_description || `Payment for ${selectedPayment?.campaign?.name || 'campaign'}`}
      />
    </div>
  );
};

export default PaymentsManager;
