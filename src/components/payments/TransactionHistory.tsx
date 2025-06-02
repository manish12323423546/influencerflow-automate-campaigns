
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Filter, Search, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string; // Changed to string to match database
  payment_type: string; // Changed to string to match database
  milestone_description: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  created_at: string;
  paid_at?: string;
  campaigns?: { name: string };
  influencers?: { name: string };
}

const TransactionHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          campaigns(name),
          influencers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = transaction.milestone_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.influencers?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.payment_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-snow">Transaction History</h2>
        </div>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between items-center p-4 border-b border-zinc-700">
                  <div className="space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-48"></div>
                    <div className="h-3 bg-zinc-700 rounded w-32"></div>
                  </div>
                  <div className="h-4 bg-zinc-700 rounded w-24"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-snow">Transaction History</h2>
          <p className="text-snow/60">View and manage all payment transactions</p>
        </div>
        
        <Button className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-snow/50" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-snow pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-zinc-700 border-zinc-600 text-snow">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] bg-zinc-700 border-zinc-600 text-snow">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-700 border-zinc-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="full">Full Payment</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-snow">Recent Transactions</CardTitle>
          <CardDescription className="text-snow/60">
            {filteredTransactions?.length || 0} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Receipt className="h-5 w-5 text-purple-400" />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-snow">
                        {transaction.milestone_description || `${transaction.payment_type} Payment`}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-snow/60">
                      <span>Campaign: {transaction.campaigns?.name || 'N/A'}</span>
                      <span className="mx-2">•</span>
                      <span>Influencer: {transaction.influencers?.name || 'N/A'}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {transaction.razorpay_payment_id && (
                      <div className="text-xs text-snow/50 mt-1">
                        Payment ID: {transaction.razorpay_payment_id}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-snow">
                    ₹{transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-snow/60 uppercase">
                    {transaction.payment_type}
                  </div>
                  {transaction.paid_at && (
                    <div className="text-xs text-green-500">
                      Paid: {new Date(transaction.paid_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredTransactions?.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-snow mb-2">No transactions found</h3>
                <p className="text-snow/60">
                  {transactions?.length === 0 
                    ? "You haven't made any payments yet." 
                    : "No transactions match your current filters."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionHistory;
