
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import SecureApiService from '@/lib/services/secureApiService';
import { useAuth } from '@/hooks/useAuth';

interface SecurePaymentFormProps {
  campaignId: string;
  influencerId: string;
  onPaymentSuccess?: () => void;
}

export const SecurePaymentForm: React.FC<SecurePaymentFormProps> = ({
  campaignId,
  influencerId,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const secureApiService = SecureApiService.getInstance();

  const handleSecurePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentData = {
        amount: Number(amount),
        campaignId,
        influencerId,
        description: description || `Payment for campaign ${campaignId}`
      };

      const result = await secureApiService.createSecurePayment(paymentData);
      
      if (result.success) {
        toast.success('Payment processed securely');
        onPaymentSuccess?.();
        setAmount('');
        setDescription('');
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      console.error('Secure payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span>Secure Payment</span>
        </CardTitle>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>All payments are processed securely</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSecurePayment} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              min="1"
              step="0.01"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment description"
            />
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Process Secure Payment</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
