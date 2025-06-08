
export interface Creator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  metrics: {
    followers: number;
    engagement: number;
    relevanceScore: number;
  };
  contactPreference?: ContactMethod;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  brand: string;
  status: string;
  budget: number;
  spent: number;
  influencer_count: number;
  reach: number;
  engagement_rate: number;
  goals: string | null;
  target_audience: string | null;
  deliverables: string | null;
  timeline: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export enum CampaignStatus {
  INITIATED = 'INITIATED',
  CREATOR_SEARCH = 'CREATOR_SEARCH',
  CONTRACT_PHASE = 'CONTRACT_PHASE',
  OUTREACH = 'OUTREACH',
  RESPONSE_PROCESSING = 'RESPONSE_PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export type ContactMethod = 'EMAIL' | 'PHONE' | 'NONE';

export interface CreatorContactPreference {
  creatorId: string;
  contactMethod: ContactMethod;
}

export interface Communication {
  id: string;
  type: 'EMAIL' | 'PHONE' | 'SYSTEM';
  content: string;
  status: 'SENT' | 'FAILED';
  timestamp: string;
  creatorId?: string;
}

export interface CampaignState {
  status: CampaignStatus;
  selectedCreators: Creator[];
  sentContracts: any[];
  communications: Communication[];
  creatorPreferences?: CreatorContactPreference[];
  executionPlan?: any;
}

export interface Contract {
  id: string;
  campaign_id: string;
  influencer_id: string;
  contract_data: ContractData;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  campaigns?: {
    name: string;
    brand: string;
  };
  influencers?: {
    name: string;
    handle: string;
    platform: string;
    avatar_url: string;
  };
}

export interface ContractData {
  fee: number;
  deadline: string;
  template_id: string;
  generated_at: string;
}
