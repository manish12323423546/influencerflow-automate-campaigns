export interface Influencer {
  id: string;
  handle: string;
  name: string;
  avatar_url?: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
  industry: string;
  language: string;
  followers_count: number;
  engagement_rate: number;
  audience_fit_score: number;
  avg_cpe: number;
  roi_index: number;
  fake_follower_score: number;
  safety_scan_score: number;
  risk_flags?: string[];
  creator_profile_id?: string;
  created_at: string;
  updated_at: string;
} 