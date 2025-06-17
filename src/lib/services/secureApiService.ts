
import { supabase } from '@/integrations/supabase/client';

class SecureApiService {
  private static instance: SecureApiService;

  private constructor() {}

  static getInstance(): SecureApiService {
    if (!SecureApiService.instance) {
      SecureApiService.instance = new SecureApiService();
    }
    return SecureApiService.instance;
  }

  async callOpenAI(messages: any[], model: string = "gpt-3.5-turbo") {
    try {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { messages, model }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Secure OpenAI call failed:', error);
      throw error;
    }
  }

  async callElevenLabs(text: string, voiceId?: string) {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice_id: voiceId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Secure ElevenLabs call failed:', error);
      throw error;
    }
  }

  async createSecurePayment(paymentData: {
    amount: number;
    campaignId: string;
    influencerId: string;
    contractId?: string;
    description?: string;
  }) {
    try {
      // If we have a contractId, update the contract payment fields
      if (paymentData.contractId) {
        // Generate a mock payment ID for demonstration
        const mockRazorpayId = 'rzp_' + Math.random().toString(36).substring(2, 15);
        const mockOrderId = 'order_' + Math.random().toString(36).substring(2, 15);
        
        // Update contract with payment information
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            payment_status: 'completed',
            payment_amount: paymentData.amount,
            razorpay_payment_id: mockRazorpayId,
            razorpay_order_id: mockOrderId,
            paid_at: new Date().toISOString()
          })
          .eq('id', paymentData.contractId);
          
        if (updateError) throw updateError;
        
        // Return success response
        return {
          success: true,
          orderId: mockOrderId,
          paymentId: mockRazorpayId
        };
      } else {
        // Fall back to the original implementation for non-contract payments
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: paymentData
        });

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Secure payment creation failed:', error);
      throw error;
    }
  }
}

export default SecureApiService;
