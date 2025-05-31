import axios from 'axios';

interface CampaignData {
  campaign_id: string;
  campaign_name: string;
  brand_name: string;
  brief: string;
  deliverables: string[];
}

interface CallResponse {
  success: boolean;
  call_id: string;
  status: string;
}

interface CallStatusResponse {
  call_id: string;
  status: string;
  duration?: number;
  ended_at?: string;
}

class ConversationalAIService {
  private apiKey: string;
  private agentId: string;
  private baseUrl: string;
  private twilioPhoneNumber: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    this.agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
    this.twilioPhoneNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async initiateOutboundCall(phoneNumber: string, campaignData: CampaignData): Promise<CallResponse> {
    try {
      // First ensure the agent is properly configured
      await this.configureAgent();

      const response = await axios.post(
        `${this.baseUrl}/convai/call`,
        {
          agent_id: this.agentId,
          from_number: this.twilioPhoneNumber,
          to_number: phoneNumber,
          first_message: `Hi, this is an AI assistant calling on behalf of ${campaignData.brand_name} regarding a potential collaboration opportunity.`,
          system_prompt: `You are an AI assistant making an outbound call on behalf of ${campaignData.brand_name}. Your goal is to discuss a collaboration opportunity for the campaign "${campaignData.campaign_name}". The campaign brief is: ${campaignData.brief}. The deliverables include: ${campaignData.deliverables.join(', ')}. Be professional, friendly, and respect the creator's time.`,
          variables: {
            ...campaignData
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        call_id: response.data.call_id,
        status: response.data.status
      };
    } catch (error) {
      console.error('Error initiating outbound call:', error);
      throw error;
    }
  }

  private async configureAgent() {
    try {
      // Configure the agent with required Twilio audio settings
      await axios.patch(
        `${this.baseUrl}/convai/agents/${this.agentId}/config`,
        {
          audio: {
            input_format: "mulaw",
            output_format: "mulaw",
            sample_rate: 8000
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error configuring agent:', error);
      throw error;
    }
  }

  async getCallStatus(callId: string): Promise<CallStatusResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/convai/calls/${callId}`,
        {
          headers: {
            'xi-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting call status:', error);
      throw error;
    }
  }
}

export const conversationalAIService = new ConversationalAIService(); 