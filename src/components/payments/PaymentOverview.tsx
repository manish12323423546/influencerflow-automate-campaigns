
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, DollarSign, Receipt, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PaymentStats {
  totalSpent: number;
  pendingPayments: number;
  completedPayments: number;
  overduePayments: number;
}

const PaymentOverview = () => {
  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: async (): Promise<PaymentStats> => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status');

      if (error) throw error;

      const totalSpent = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const completedPayments = payments.filter(p => p.status === 'completed').length;
      const overduePayments = payments.filter(p => p.status === 'failed').length;

      return {
        totalSpent,
        pendingPayments,
        completedPayments,
        overduePayments
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
              <div className="h-8 bg-zinc-700 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Spent",
      value: `₹${paymentStats?.totalSpent.toLocaleString() || 0}`,
      icon: DollarSign,
      description: "Total amount paid to influencers",
      color: "text-green-600"
    },
    {
      title: "Pending Payments",
      value: paymentStats?.pendingPayments || 0,
      icon: Clock,
      description: "Payments awaiting processing",
      color: "text-yellow-600"
    },
    {
      title: "Completed",
      value: paymentStats?.completedPayments || 0,
      icon: CheckCircle,
      description: "Successfully completed payments",
      color: "text-green-600"
    },
    {
      title: "Issues",
      value: paymentStats?.overduePayments || 0,
      icon: AlertCircle,
      description: "Failed or problematic payments",
      color: "text-red-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-zinc-800/50 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-snow/80">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <p className="text-xs text-snow/60">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PaymentOverview;
