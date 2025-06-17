export interface Report {
  id: string;
  campaign_ids: string[];
  range_start: string;
  range_end: string;
  status: 'ready' | 'failed';
  created_at: string;
  updated_at: string;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_spend: number;
}

export interface ReportRequest {
  id: string;
  brand_user_id: string;
  range_start: string;
  range_end: string;
  filters_json: {
    campaign_ids?: string[];
    campaigns?: string[];
    [key: string]: any;
  };
  status: 'processing' | 'completed' | 'failed';
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportMetric {
  id: string;
  report_id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  created_at: string;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  created_at: string;
}

// Define Database type with our new tables
export type Database = {
  public: {
    Tables: {
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>;
        Update: Partial<Report>;
      };
      report_requests: {
        Row: ReportRequest;
        Insert: Omit<ReportRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ReportRequest>;
      };
      report_metrics: {
        Row: ReportMetric;
        Insert: Omit<ReportMetric, 'id' | 'created_at'>;
        Update: Partial<ReportMetric>;
      };
      campaign_metrics: {
        Row: CampaignMetric;
        Insert: Omit<CampaignMetric, 'id' | 'created_at'>;
        Update: Partial<CampaignMetric>;
      };
      // Add existing tables
      campaigns: {
        Row: any;
        Insert: any;
        Update: any;
      };
      // Add other existing tables as needed
    };
    Views: {
      [key: string]: {
        Row: Record<string, any>;
      };
    };
  };
}; 