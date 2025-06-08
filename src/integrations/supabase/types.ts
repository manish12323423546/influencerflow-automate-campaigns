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
      brand_profiles: {
        Row: {
          company_description: string | null
          company_logo_url: string | null
          company_name: string | null
          company_size: string | null
          company_website: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          headquarters_location: string | null
          id: string
          industry: string | null
          social_media_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          social_media_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_description?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          social_media_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_automation_logs: {
        Row: {
          automation_mode: string
          automation_session_id: string
          campaign_id: string | null
          completed_at: string | null
          completed_steps: number | null
          contracts_generated: number | null
          contracts_sent: number | null
          created_at: string | null
          creators_contacted: number | null
          creators_found: number | null
          current_step: string | null
          emails_sent: number | null
          error_logs: Json | null
          failed_communications: number | null
          final_status: string | null
          id: string
          performance_metrics: Json | null
          phone_calls_made: number | null
          started_at: string | null
          status: string
          step_logs: Json | null
          successful_communications: number | null
          summary_report: Json | null
          total_steps: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          automation_mode: string
          automation_session_id: string
          campaign_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          contracts_generated?: number | null
          contracts_sent?: number | null
          created_at?: string | null
          creators_contacted?: number | null
          creators_found?: number | null
          current_step?: string | null
          emails_sent?: number | null
          error_logs?: Json | null
          failed_communications?: number | null
          final_status?: string | null
          id?: string
          performance_metrics?: Json | null
          phone_calls_made?: number | null
          started_at?: string | null
          status?: string
          step_logs?: Json | null
          successful_communications?: number | null
          summary_report?: Json | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          automation_mode?: string
          automation_session_id?: string
          campaign_id?: string | null
          completed_at?: string | null
          completed_steps?: number | null
          contracts_generated?: number | null
          contracts_sent?: number | null
          created_at?: string | null
          creators_contacted?: number | null
          creators_found?: number | null
          current_step?: string | null
          emails_sent?: number | null
          error_logs?: Json | null
          failed_communications?: number | null
          final_status?: string | null
          id?: string
          performance_metrics?: Json | null
          phone_calls_made?: number | null
          started_at?: string | null
          status?: string
          step_logs?: Json | null
          successful_communications?: number | null
          summary_report?: Json | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_automation_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_influencers: {
        Row: {
          campaign_id: string | null
          created_at: string
          fee: number
          id: string
          influencer_id: string | null
          match_reason: string | null
          match_score: number | null
          status: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          influencer_id?: string | null
          match_reason?: string | null
          match_score?: number | null
          status: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          fee?: number
          id?: string
          influencer_id?: string | null
          match_reason?: string | null
          match_score?: number | null
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
          {
            foreignKeyName: "campaign_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      campaign_influencers_backup: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          fee: number | null
          id: string | null
          influencer_id: string | null
          match_reason: string | null
          match_score: number | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          fee?: number | null
          id?: string | null
          influencer_id?: string | null
          match_reason?: string | null
          match_score?: number | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          fee?: number | null
          id?: string | null
          influencer_id?: string | null
          match_reason?: string | null
          match_score?: number | null
          status?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brand: string
          budget: number | null
          created_at: string | null
          deliverables: string | null
          description: string | null
          engagement_rate: number | null
          goals: string | null
          id: string
          influencer_count: number | null
          mode: string | null
          name: string
          reach: number | null
          spent: number | null
          status: string | null
          target_audience: string | null
          timeline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand: string
          budget?: number | null
          created_at?: string | null
          deliverables?: string | null
          description?: string | null
          engagement_rate?: number | null
          goals?: string | null
          id?: string
          influencer_count?: number | null
          mode?: string | null
          name: string
          reach?: number | null
          spent?: number | null
          status?: string | null
          target_audience?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          budget?: number | null
          created_at?: string | null
          deliverables?: string | null
          description?: string | null
          engagement_rate?: number | null
          goals?: string | null
          id?: string
          influencer_count?: number | null
          mode?: string | null
          name?: string
          reach?: number | null
          spent?: number | null
          status?: string | null
          target_audience?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          influencer_id: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          influencer_id?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          influencer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      contract_automation: {
        Row: {
          brand_name: string
          brand_representative: string | null
          campaign_date: string
          campaign_goal: string
          campaign_requirements: string
          campaign_title: string
          deal_amount: string | null
          deliverables: string
          download_url: string | null
          id: number
          influencer_name: string
          payment_method: string | null
          payment_terms: string | null
          special_instructions: string
        }
        Insert: {
          brand_name: string
          brand_representative?: string | null
          campaign_date: string
          campaign_goal: string
          campaign_requirements: string
          campaign_title: string
          deal_amount?: string | null
          deliverables: string
          download_url?: string | null
          id?: number
          influencer_name: string
          payment_method?: string | null
          payment_terms?: string | null
          special_instructions: string
        }
        Update: {
          brand_name?: string
          brand_representative?: string | null
          campaign_date?: string
          campaign_goal?: string
          campaign_requirements?: string
          campaign_title?: string
          deal_amount?: string | null
          deliverables?: string
          download_url?: string | null
          id?: number
          influencer_name?: string
          payment_method?: string | null
          payment_terms?: string | null
          special_instructions?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          content_md: string
          created_at: string
          id: string
          name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          brand_user_id: string
          campaign_id: string
          contract_data: Json | null
          created_at: string | null
          id: string
          influencer_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brand_user_id: string
          campaign_id: string
          contract_data?: Json | null
          created_at?: string | null
          id?: string
          influencer_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_user_id?: string
          campaign_id?: string
          contract_data?: Json | null
          created_at?: string | null
          id?: string
          influencer_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      contracts_backup: {
        Row: {
          brand_user_id: string | null
          campaign_id: string | null
          contract_data: Json | null
          created_at: string | null
          id: string | null
          influencer_id: string | null
          pdf_url: string | null
          signed_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand_user_id?: string | null
          campaign_id?: string | null
          contract_data?: Json | null
          created_at?: string | null
          id?: string | null
          influencer_id?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_user_id?: string | null
          campaign_id?: string | null
          contract_data?: Json | null
          created_at?: string | null
          id?: string | null
          influencer_id?: string | null
          pdf_url?: string | null
          signed_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          brand_user_id: string
          created_at: string | null
          id: string
          influencer_id: string
          last_message: string | null
          last_message_time: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          brand_user_id: string
          created_at?: string | null
          id?: string
          influencer_id: string
          last_message?: string | null
          last_message_time?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_user_id?: string
          created_at?: string | null
          id?: string
          influencer_id?: string
          last_message?: string | null
          last_message_time?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          bio: string | null
          content_categories: string[] | null
          created_at: string
          experience_level: string | null
          id: string
          location: string | null
          niche: string | null
          portfolio_urls: string[] | null
          preferred_language: string | null
          profile_image_url: string | null
          rate_per_post: number | null
          rate_per_reel: number | null
          rate_per_story: number | null
          social_media_links: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          content_categories?: string[] | null
          created_at?: string
          experience_level?: string | null
          id?: string
          location?: string | null
          niche?: string | null
          portfolio_urls?: string[] | null
          preferred_language?: string | null
          profile_image_url?: string | null
          rate_per_post?: number | null
          rate_per_reel?: number | null
          rate_per_story?: number | null
          social_media_links?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          content_categories?: string[] | null
          created_at?: string
          experience_level?: string | null
          id?: string
          location?: string | null
          niche?: string | null
          portfolio_urls?: string[] | null
          preferred_language?: string | null
          profile_image_url?: string | null
          rate_per_post?: number | null
          rate_per_reel?: number | null
          rate_per_story?: number | null
          social_media_links?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_automation: {
        Row: {
          campaign_id: string
          campaign_name: string
          competitor_brands: Json
          contract_end_date: string | null
          contract_id: string
          contract_start_date: string | null
          contract_type: string | null
          currency: string | null
          deliverables: Json
          engagement_rate: number | null
          exclusivity_applicable: boolean | null
          exclusivity_category: string | null
          exclusivity_duration: string | null
          followers_instagram: number | null
          followers_youtube: number | null
          id: number
          influencer_category: string | null
          influencer_id: string
          influencer_name: string
          instagram_handle: string | null
          payment_schedule: Json
          termination_clause: string | null
          total_fee: number | null
          youtube_handle: string | null
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          competitor_brands: Json
          contract_end_date?: string | null
          contract_id: string
          contract_start_date?: string | null
          contract_type?: string | null
          currency?: string | null
          deliverables: Json
          engagement_rate?: number | null
          exclusivity_applicable?: boolean | null
          exclusivity_category?: string | null
          exclusivity_duration?: string | null
          followers_instagram?: number | null
          followers_youtube?: number | null
          id?: number
          influencer_category?: string | null
          influencer_id: string
          influencer_name: string
          instagram_handle?: string | null
          payment_schedule: Json
          termination_clause?: string | null
          total_fee?: number | null
          youtube_handle?: string | null
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          competitor_brands?: Json
          contract_end_date?: string | null
          contract_id?: string
          contract_start_date?: string | null
          contract_type?: string | null
          currency?: string | null
          deliverables?: Json
          engagement_rate?: number | null
          exclusivity_applicable?: boolean | null
          exclusivity_category?: string | null
          exclusivity_duration?: string | null
          followers_instagram?: number | null
          followers_youtube?: number | null
          id?: number
          influencer_category?: string | null
          influencer_id?: string
          influencer_name?: string
          instagram_handle?: string | null
          payment_schedule?: Json
          termination_clause?: string | null
          total_fee?: number | null
          youtube_handle?: string | null
        }
        Relationships: []
      }
      influencers: {
        Row: {
          audience_fit_score: number
          avatar_url: string | null
          avg_cpe: number
          created_at: string
          creator_profile_id: string | null
          engagement_rate: number
          fake_follower_score: number
          followers_count: number
          gmail_gmail: string | null
          handle: string
          id: string
          industry: string
          is_online: boolean | null
          language: string
          last_seen: string | null
          name: string
          phone_no: number | null
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
          creator_profile_id?: string | null
          engagement_rate?: number
          fake_follower_score?: number
          followers_count?: number
          gmail_gmail?: string | null
          handle: string
          id?: string
          industry: string
          is_online?: boolean | null
          language?: string
          last_seen?: string | null
          name: string
          phone_no?: number | null
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
          creator_profile_id?: string | null
          engagement_rate?: number
          fake_follower_score?: number
          followers_count?: number
          gmail_gmail?: string | null
          handle?: string
          id?: string
          industry?: string
          is_online?: boolean | null
          language?: string
          last_seen?: string | null
          name?: string
          phone_no?: number | null
          platform?: string
          risk_flags?: string[] | null
          roi_index?: number
          safety_scan_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencers_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          brand_user_id: string
          campaign_id: string | null
          created_at: string
          due_date: string | null
          id: string
          influencer_id: string | null
          invoice_number: string
          issued_at: string | null
          notes: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          brand_user_id: string
          campaign_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          influencer_id?: string | null
          invoice_number: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          brand_user_id?: string
          campaign_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          influencer_id?: string | null
          invoice_number?: string
          issued_at?: string | null
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          campaign_updates: boolean | null
          contract_updates: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          influencer_responses: boolean | null
          marketing_emails: boolean | null
          performance_reports: boolean | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_updates?: boolean | null
          contract_updates?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          influencer_responses?: boolean | null
          marketing_emails?: boolean | null
          performance_reports?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_updates?: boolean | null
          contract_updates?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          influencer_responses?: boolean | null
          marketing_emails?: boolean | null
          performance_reports?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_campaign_id: string | null
          related_influencer_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_campaign_id?: string | null
          related_influencer_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_campaign_id?: string | null
          related_influencer_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_influencer_id_fkey"
            columns: ["related_influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_influencer_id_fkey"
            columns: ["related_influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      outreach: {
        Row: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          id: string
          influencer_id: string | null
          last_contacted_at: string | null
          next_followup_at: string | null
          notes: string | null
          outreach_method: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          influencer_id?: string | null
          last_contacted_at?: string | null
          next_followup_at?: string | null
          notes?: string | null
          outreach_method: string
          status: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          influencer_id?: string | null
          last_contacted_at?: string | null
          next_followup_at?: string | null
          notes?: string | null
          outreach_method?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      outreach_history: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          outreach_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          outreach_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          outreach_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_history_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "outreach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_history_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["outreach_id"]
          },
        ]
      }
      payment_milestones: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          created_at: string
          due_date: string | null
          id: string
          influencer_id: string
          milestone_description: string | null
          milestone_name: string
          payment_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          influencer_id: string
          milestone_description?: string | null
          milestone_name: string
          payment_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          influencer_id?: string
          milestone_description?: string | null
          milestone_name?: string
          payment_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_milestones_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
          {
            foreignKeyName: "payment_milestones_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          brand_user_id: string
          campaign_id: string | null
          created_at: string
          currency: string | null
          id: string
          influencer_id: string | null
          invoice_url: string | null
          milestone_description: string | null
          paid_at: string | null
          payment_type: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          brand_user_id: string
          campaign_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          influencer_id?: string | null
          invoice_url?: string | null
          milestone_description?: string | null
          paid_at?: string | null
          payment_type?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          brand_user_id?: string
          campaign_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          influencer_id?: string | null
          invoice_url?: string | null
          milestone_description?: string | null
          paid_at?: string | null
          payment_type?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      performance_reports: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          influencer_id: string | null
          report_data: Json
          report_type: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          influencer_id?: string | null
          report_data: Json
          report_type?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          influencer_id?: string | null
          report_data?: Json
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reports_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reports_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
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
            foreignKeyName: "posts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["influencer_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          location: string | null
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      report_requests: {
        Row: {
          brand_user_id: string
          created_at: string
          filters_json: Json
          id: string
          pdf_url: string | null
          range_end: string
          range_start: string
          status: string
          updated_at: string
        }
        Insert: {
          brand_user_id: string
          created_at?: string
          filters_json?: Json
          id?: string
          pdf_url?: string | null
          range_end: string
          range_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand_user_id?: string
          created_at?: string
          filters_json?: Json
          id?: string
          pdf_url?: string | null
          range_end?: string
          range_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      s: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      outreach_history_view: {
        Row: {
          history_items: Json | null
          outreach_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_history_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "outreach"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_history_outreach_id_fkey"
            columns: ["outreach_id"]
            isOneToOne: false
            referencedRelation: "outreach_influencer_view"
            referencedColumns: ["outreach_id"]
          },
        ]
      }
      outreach_influencer_view: {
        Row: {
          audience_fit_score: number | null
          avatar_url: string | null
          campaign_brand: string | null
          campaign_id: string | null
          campaign_name: string | null
          engagement_rate: number | null
          followers_count: number | null
          gmail_gmail: string | null
          handle: string | null
          industry: string | null
          influencer_id: string | null
          influencer_name: string | null
          language: string | null
          last_contacted_at: string | null
          next_followup_at: string | null
          notes: string | null
          outreach_created_at: string | null
          outreach_id: string | null
          outreach_method: string | null
          outreach_status: string | null
          outreach_updated_at: string | null
          phone_no: number | null
          platform: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_outreach: {
        Args: {
          p_influencer_id: string
          p_campaign_id: string
          p_user_id: string
          p_initial_notes?: string
        }
        Returns: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          id: string
          influencer_id: string | null
          last_contacted_at: string | null
          next_followup_at: string | null
          notes: string | null
          outreach_method: string
          status: string
          updated_at: string
        }
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      record_outreach_contact: {
        Args: {
          p_outreach_id: string
          p_user_id: string
          p_contact_method: string
          p_contact_details: string
          p_next_followup_date?: string
        }
        Returns: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          id: string
          influencer_id: string | null
          last_contacted_at: string | null
          next_followup_at: string | null
          notes: string | null
          outreach_method: string
          status: string
          updated_at: string
        }
      }
      update_outreach_status: {
        Args: {
          p_outreach_id: string
          p_new_status: string
          p_user_id: string
          p_notes?: string
        }
        Returns: {
          campaign_id: string | null
          created_at: string
          created_by: string | null
          id: string
          influencer_id: string | null
          last_contacted_at: string | null
          next_followup_at: string | null
          notes: string | null
          outreach_method: string
          status: string
          updated_at: string
        }
      }
    }
    Enums: {
      app_role: "brand" | "creator"
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
    Enums: {
      app_role: ["brand", "creator"],
    },
  },
} as const
