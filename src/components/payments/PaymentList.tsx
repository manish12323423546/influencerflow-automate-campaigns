import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_type: string;
  created_at: string;
  campaigns?: {
    name: string;
    brand: string;
  };
  influencers?: {
    name: string;
    handle: string;
    platform: string;
  };
}

export const PaymentList = () => {
  // Fetch payments with campaign and influencer details
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments-with-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          campaigns (
            name,
            brand
          ),
          influencers (
            name,
            handle,
            platform
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead>Campaign</TableHead>
            <TableHead>Influencer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-snow/60 py-8">
                No payments found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id} className="border-zinc-800">
                <TableCell>
                  <div className="font-medium">{payment.campaigns?.name}</div>
                  <div className="text-sm text-snow/60">{payment.campaigns?.brand}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{payment.influencers?.name}</div>
                  <div className="text-sm text-snow/60">
                    {payment.influencers?.handle} • {payment.influencers?.platform}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {payment.payment_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-snow/60">
                  {new Date(payment.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}; 