
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
    description?: string;
  }) {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: paymentData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Secure payment creation failed:', error);
      throw error;
    }
  }
}

export default SecureApiService;
