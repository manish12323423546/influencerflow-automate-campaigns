export enum CampaignStatus {
  INITIATED = 'INITIATED',
  CREATOR_SEARCH = 'CREATOR_SEARCH',
  CONTRACT_PHASE = 'CONTRACT_PHASE',
  OUTREACH = 'OUTREACH',
  RESPONSE_PROCESSING = 'RESPONSE_PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ContactMethod = 'EMAIL' | 'PHONE' | 'NONE';

export interface CreatorContactPreference {
  creatorId: string;
  contactMethod: ContactMethod;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
  metrics: {
    followers: number;
    engagement: number;
  };
  contactPreference?: ContactMethod;
}

export interface Contract {
  id: string;
  creatorId: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'REJECTED';
  content: any;
}

export interface Communication {
  id: string;
  creatorId: string;
  type: 'EMAIL' | 'SYSTEM' | 'PHONE';
  status: 'SENT' | 'FAILED';
  content: string;
  timestamp: string;
}

export interface ExecutionPlan {
  sequence: Array<{
    type: 'EMAIL' | 'PHONE';
    creatorId: string;
    priority: number;
    reasoning: string;
  }>;
  strategy_reasoning: string;
}

export interface CampaignState {
  status: CampaignStatus;
  selectedCreators: Creator[];
  sentContracts: Contract[];
  communications: Communication[];
  error?: string;
  executionPlan?: ExecutionPlan;
  creatorPreferences?: CreatorContactPreference[];
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  brand: string;
  goals: string;
  target_audience: string;
  budget: number;
  deliverables: string;
  timeline?: string;
  status: string;
  settings?: {
    platform?: string;
    min_followers?: number;
    max_engagement_rate?: number;
  };
  campaign_influencers?: Array<{
    influencer_id: string;
    status: string;
    match_score?: number;
    match_reason?: string;
    fee?: number;
  }>;
  influencers?: Array<any>; // Array of influencer objects
} 