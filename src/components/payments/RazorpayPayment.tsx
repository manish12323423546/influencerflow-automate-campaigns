
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): {
        open: () => void;
      };
    };
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme: {
    color: string;
  };
  modal?: {
    ondismiss: () => void;
  };
}

interface RazorpayPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaignId?: string;
  influencerId?: string;
  milestoneId?: string;
  amount?: number;
  description?: string;
}

const RazorpayPayment = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  campaignId, 
  influencerId, 
  milestoneId,
  amount: defaultAmount,
  description 
}: RazorpayPaymentProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: defaultAmount?.toString() || '',
    currency: 'INR',
    paymentType: 'milestone'
  });

  // Update amount when defaultAmount changes
  useState(() => {
    if (defaultAmount) {
      setPaymentData(prev => ({
        ...prev,
        amount: defaultAmount.toString()
      }));
    }
  });

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // For test mode, we'll directly initiate the payment without creating an order
      // This works in test mode but for production, you'd need server-side order creation
      const amountInPaise = Math.round(parseFloat(paymentData.amount) * 100);
      
      // Store payment info in database
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const paymentCampaignId = campaignId && campaignId !== '1' && campaignId !== '2' && campaignId !== '3' ? campaignId : null;
      const paymentInfluencerId = influencerId && influencerId.includes('-') ? influencerId : null;
      const paymentMilestoneId = milestoneId && milestoneId.includes('-') ? milestoneId : null;
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          campaign_id: paymentCampaignId,
          influencer_id: paymentInfluencerId,
          brand_user_id: testUserId,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          payment_type: paymentData.paymentType,
          milestone_description: description || null,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        throw new Error('Failed to create payment record');
      }

      // Initialize basic Razorpay payment for test mode
      const options: RazorpayOptions = {
        key: 'rzp_test_iZbabM5Zru76Fd', // Your Razorpay Test Key ID
        amount: amountInPaise,
        currency: paymentData.currency,
        name: 'Creator Campaign Platform',
        description: description || 'Campaign Payment',
        image: 'https://your-logo-url.png', // Optional
        prefill: {
          name: 'Customer Name', // Optional
          email: 'customer@example.com', // Optional
          contact: '9999999999' // Optional
        },
        notes: {
          payment_id: payment.id,
          campaign_id: paymentCampaignId || '',
          influencer_id: paymentInfluencerId || '',
          milestone_id: paymentMilestoneId || ''
        },
        handler: async function(response) {
          try {
            console.log('Payment successful:', response);
            
            // Update payment record with Razorpay payment ID
            await supabase
              .from('payments')
              .update({
                status: 'completed',
                razorpay_payment_id: response.razorpay_payment_id,
                paid_at: new Date().toISOString()
              })
              .eq('id', payment.id);

            // Update milestone if applicable
            if (paymentMilestoneId) {
              await supabase
                .from('payment_milestones')
                .update({
                  status: 'paid',
                  payment_id: payment.id
                })
                .eq('id', paymentMilestoneId);
            }

            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully.",
            });

            onSuccess();
            onClose();
          } catch (error) {
            console.error('Payment record update failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support for assistance.",
              variant: "destructive"
            });
          }
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Make Payment
          </DialogTitle>
          <DialogDescription>
            {description || 'Process payment using Razorpay'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              disabled={!!defaultAmount}
              className={defaultAmount ? "bg-gray-100 cursor-not-allowed" : ""}
            />
            {defaultAmount && (
              <p className="text-xs text-gray-500">Amount is pre-filled from the selected payment</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={paymentData.currency} onValueChange={(value) => setPaymentData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select value={paymentData.paymentType} onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="milestone">Milestone Payment</SelectItem>
                <SelectItem value="full">Full Payment</SelectItem>
                <SelectItem value="advance">Advance Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={loading || !paymentData.amount}
            className="bg-coral hover:bg-coral/90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay ₹{paymentData.amount}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RazorpayPayment;
