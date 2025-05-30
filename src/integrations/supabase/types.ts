export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campaign_influencers: {
        Row: {
          campaign_id: string | null
          created_at: string
          fee: number
          id: string
          influencer_id: string | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          influencer_id?: string | null
          status: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          influencer_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand: string
          budget: number
          created_at: string
          engagement_rate: number
          id: string
          influencer_count: number
          name: string
          reach: number
          spent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          budget?: number
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_count?: number
          name: string
          reach?: number
          spent?: number
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          budget?: number
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_count?: number
          name?: string
          reach?: number
          spent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencers: {
        Row: {
          audience_fit_score: number
          avatar_url: string | null
          avg_cpe: number
          created_at: string
          engagement_rate: number
          fake_follower_score: number
          followers_count: number
          handle: string
          id: string
          industry: string
          language: string
          name: string
          platform: string
          risk_flags: string[] | null
          roi_index: number
          safety_scan_score: number
          updated_at: string
        }
        Insert: {
          audience_fit_score?: number
          avatar_url?: string | null
          avg_cpe?: number
          created_at?: string
          engagement_rate?: number
          fake_follower_score?: number
          followers_count?: number
          handle: string
          id?: string
          industry: string
          language?: string
          name: string
          platform: string
          risk_flags?: string[] | null
          roi_index?: number
          safety_scan_score?: number
          updated_at?: string
        }
        Update: {
          audience_fit_score?: number
          avatar_url?: string | null
          avg_cpe?: number
          created_at?: string
          engagement_rate?: number
          fake_follower_score?: number
          followers_count?: number
          handle?: string
          id?: string
          industry?: string
          language?: string
          name?: string
          platform?: string
          risk_flags?: string[] | null
          roi_index?: number
          safety_scan_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          campaign_id: string | null
          comments_count: number
          content: string | null
          created_at: string
          engagement_rate: number
          id: string
          influencer_id: string | null
          likes_count: number
          platform_post_id: string
          posted_at: string
          shares_count: number
          updated_at: string
          views_count: number
        }
        Insert: {
          campaign_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_id?: string | null
          likes_count?: number
          platform_post_id: string
          posted_at?: string
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          campaign_id?: string | null
          comments_count?: number
          content?: string | null
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_id?: string | null
          likes_count?: number
          platform_post_id?: string
          posted_at?: string
          shares_count?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
