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

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          campaigns!inner(name, brand),
          influencers!inner(name, handle)
        `)
        .eq('brand_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to handle potential array responses
      const transformedPayments = data?.map(payment => ({
        ...payment,
        campaigns: Array.isArray(payment.campaigns) ? payment.campaigns[0] : payment.campaigns,
        influencers: Array.isArray(payment.influencers) ? payment.influencers[0] : payment.influencers
      })) || [];

      setPayments(transformedPayments as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to fetch payments');
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
          <h2 className="text-2xl font-bold">Recent Payments</h2>
          <p className="text-muted-foreground">View and manage your payment history</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Payment #{payment.id.substring(0, 8)}</span>
              </CardTitle>
              <CardDescription>{payment.milestone_description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{payment.influencers?.name} (@{payment.influencers?.handle})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>{payment.campaigns?.name} ({payment.campaigns?.brand})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(payment.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Amount: ${payment.amount}</span>
              </div>
              <div>
                <Badge variant="secondary">{payment.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
