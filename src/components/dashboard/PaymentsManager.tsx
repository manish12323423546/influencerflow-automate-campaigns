
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  creatorName: string;
  campaignName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dueDate: string;
  type: 'milestone' | 'final' | 'advance';
}

interface Transaction {
  id: string;
  creatorName: string;
  amount: number;
  status: 'completed' | 'failed' | 'refunded';
  date: string;
  type: 'payment' | 'refund';
  paymentMethod: string;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    creatorName: 'Sarah Johnson',
    campaignName: 'Tech Product Launch',
    amount: 1250,
    status: 'pending',
    dueDate: '2024-01-25',
    type: 'milestone'
  },
  {
    id: '2',
    creatorName: 'Mike Chen',
    campaignName: 'Fitness App Promotion',
    amount: 900,
    status: 'processing',
    dueDate: '2024-01-20',
    type: 'final'
  },
  {
    id: '3',
    creatorName: 'Emma Style',
    campaignName: 'Fashion Summer Collection',
    amount: 500,
    status: 'completed',
    dueDate: '2024-01-15',
    type: 'advance'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    creatorName: 'Emma Style',
    amount: 500,
    status: 'completed',
    date: '2024-01-15',
    type: 'payment',
    paymentMethod: 'Razorpay'
  },
  {
    id: '2',
    creatorName: 'Alex Martinez',
    amount: 1200,
    status: 'completed',
    date: '2024-01-10',
    type: 'payment',
    paymentMethod: 'Bank Transfer'
  },
  {
    id: '3',
    creatorName: 'Lisa Wang',
    amount: 300,
    status: 'refunded',
    date: '2024-01-08',
    type: 'refund',
    paymentMethod: 'Razorpay'
  }
];

const PaymentsManager = () => {
  const { toast } = useToast();
  const [payments] = useState<Payment[]>(mockPayments);
  const [transactions] = useState<Transaction[]>(mockTransactions);

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

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'refunded':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handlePayNow = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    toast({
      title: "Payment initiated",
      description: `Payment of $${payment?.amount} to ${payment?.creatorName} has been initiated.`,
    });
  };

  // Calculate summary stats
  const paymentStats = {
    pending: payments.filter(p => p.status === 'pending').length,
    processing: payments.filter(p => p.status === 'processing').length,
    completed: payments.filter(p => p.status === 'completed').length,
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalCompleted: transactions.filter(t => t.status === 'completed' && t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium text-snow/80">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-coral" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">${paymentStats.totalCompleted.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-snow">0</div>
          </CardContent>
        </Card>
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
                    <TableHead className="text-snow/80">Creator</TableHead>
                    <TableHead className="text-snow/80">Campaign</TableHead>
                    <TableHead className="text-snow/80">Amount</TableHead>
                    <TableHead className="text-snow/80">Type</TableHead>
                    <TableHead className="text-snow/80">Due Date</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                    <TableHead className="text-snow/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-zinc-700 hover:bg-zinc-700/50">
                      <TableCell className="font-medium text-snow">{payment.creatorName}</TableCell>
                      <TableCell className="text-snow/80">{payment.campaignName}</TableCell>
                      <TableCell className="text-snow/80">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-600 text-snow/70">
                          {payment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">{payment.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <Button
                            onClick={() => handlePayNow(payment.id)}
                            size="sm"
                            className="bg-coral hover:bg-coral/90 text-white"
                          >
                            Pay Now
                          </Button>
                        )}
                        {payment.status === 'processing' && (
                          <span className="text-sm text-snow/60">Processing...</span>
                        )}
                        {payment.status === 'completed' && (
                          <span className="text-sm text-green-400">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead className="text-snow/80">Creator</TableHead>
                    <TableHead className="text-snow/80">Amount</TableHead>
                    <TableHead className="text-snow/80">Type</TableHead>
                    <TableHead className="text-snow/80">Method</TableHead>
                    <TableHead className="text-snow/80">Date</TableHead>
                    <TableHead className="text-snow/80">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-zinc-700 hover:bg-zinc-700/50">
                      <TableCell className="font-medium text-snow">{transaction.creatorName}</TableCell>
                      <TableCell className="text-snow/80">
                        {transaction.type === 'refund' ? '-' : ''}${transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-600 text-snow/70">
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-snow/80">{transaction.paymentMethod}</TableCell>
                      <TableCell className="text-snow/80">{transaction.date}</TableCell>
                      <TableCell>
                        <Badge className={getTransactionStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsManager;
