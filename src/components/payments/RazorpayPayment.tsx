
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
    Razorpay: any;
  }
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

// Generate a UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
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

      // Convert string IDs to proper UUIDs or null for test payments
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const paymentCampaignId = campaignId && campaignId !== '1' && campaignId !== '2' && campaignId !== '3' ? campaignId : null;
      const paymentInfluencerId = influencerId && influencerId.includes('-') ? influencerId : null;
      const paymentMilestoneId = milestoneId && milestoneId.includes('-') ? milestoneId : null;

      // Create payment record first (without user authentication)
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          campaign_id: paymentCampaignId,
          influencer_id: paymentInfluencerId,
          brand_user_id: testUserId,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          payment_type: paymentData.paymentType,
          milestone_description: description || null
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          receipt: `payment_${payment.id}`,
          campaignId: paymentCampaignId,
          influencerId: paymentInfluencerId,
          milestoneId: paymentMilestoneId
        }
      });

      if (orderError) throw orderError;

      // Update payment with Razorpay order ID
      await supabase
        .from('payments')
        .update({ razorpay_order_id: orderData.id })
        .eq('id', payment.id);

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_test_iZbabM5Zru76Fd', // Your Razorpay Key ID
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Creator Campaign Platform',
        description: description || 'Campaign Payment',
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentData: {
                  milestoneId: paymentMilestoneId,
                  campaignId: paymentCampaignId,
                  influencerId: paymentInfluencerId
                }
              }
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment Successful",
              description: "Your payment has been processed successfully.",
            });

            onSuccess();
            onClose();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support for assistance.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          email: 'test@example.com', // Default test email
          contact: '9999999999' // Default test contact
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: () => {
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
        description: "Failed to initiate payment. Please try again.",
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
            />
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
            className="bg-purple-600 hover:bg-purple-700"
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
