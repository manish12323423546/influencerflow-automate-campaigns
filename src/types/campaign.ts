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