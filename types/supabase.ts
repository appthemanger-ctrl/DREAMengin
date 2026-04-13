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
      admin_lock: {
        Row: {
          id: boolean
          locked: boolean
          locked_at: string | null
          reason: string | null
        }
        Insert: {
          id?: boolean
          locked?: boolean
          locked_at?: string | null
          reason?: string | null
        }
        Update: {
          id?: boolean
          locked?: boolean
          locked_at?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      board_posts: {
        Row: {
          author_id: string
          board_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          updated_at: string
        }
        Insert: {
          author_id: string
          board_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string
          board_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_contact_requests: {
        Row: {
          id: string
          item_id: string
          requester_id: string
          seller_id: string
          message: string | null
          status: 'pending' | 'acknowledged' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          requester_id: string
          seller_id: string
          message?: string | null
          status?: 'pending' | 'acknowledged' | 'closed'
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          requester_id?: string
          seller_id?: string
          message?: string | null
          status?: 'pending' | 'acknowledged' | 'closed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_contact_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          preview_url: string | null
          price_cents: number
          seller_id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          preview_url?: string | null
          price_cents?: number
          seller_id: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          preview_url?: string | null
          price_cents?: number
          seller_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          ad_slot_id: string
          ad_type: string
          advertiser_id: string
          campaign_name: string
          clicks: number | null
          content: Json | null
          conversions: number | null
          created_at: string | null
          duration_days: number | null
          end_date: string
          id: string
          seller_id: string
          start_date: string
          status: string | null
          total_cost: number | null
          views: number | null
        }
        Insert: {
          ad_slot_id: string
          ad_type: string
          advertiser_id: string
          campaign_name: string
          clicks?: number | null
          content?: Json | null
          conversions?: number | null
          created_at?: string | null
          duration_days?: number | null
          end_date: string
          id?: string
          seller_id: string
          start_date: string
          status?: string | null
          total_cost?: number | null
          views?: number | null
        }
        Update: {
          ad_slot_id?: string
          ad_type?: string
          advertiser_id?: string
          campaign_name?: string
          clicks?: number | null
          content?: Json | null
          conversions?: number | null
          created_at?: string | null
          duration_days?: number | null
          end_date?: string
          id?: string
          seller_id?: string
          start_date?: string
          status?: string | null
          total_cost?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_campaigns_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_listings: {
        Row: {
          ad_slot_id: string
          created_at: string
          description: string | null
          id: string
          price: number
          seller_id: string
          title: string
        }
        Insert: {
          ad_slot_id: string
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          seller_id: string
          title: string
        }
        Update: {
          ad_slot_id?: string
          created_at?: string
          description?: string | null
          id?: string
          price?: number
          seller_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_listings_ad_slot_id_fkey"
            columns: ["ad_slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_orders: {
        Row: {
          ad_listing_id: string
          buyer_id: string
          created_at: string
          creator_payout: number | null
          creator_share: number | null
          gross_revenue: number | null
          id: string
          platform_payout: number | null
          platform_share: number | null
          status: string
        }
        Insert: {
          ad_listing_id: string
          buyer_id: string
          created_at?: string
          creator_payout?: number | null
          creator_share?: number | null
          gross_revenue?: number | null
          id?: string
          platform_payout?: number | null
          platform_share?: number | null
          status?: string
        }
        Update: {
          ad_listing_id?: string
          buyer_id?: string
          created_at?: string
          creator_payout?: number | null
          creator_share?: number | null
          gross_revenue?: number | null
          id?: string
          platform_payout?: number | null
          platform_share?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_orders_ad_listing_id_fkey"
            columns: ["ad_listing_id"]
            isOneToOne: false
            referencedRelation: "ad_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          max_concurrent_ads: number | null
          price_per_custom: number | null
          price_per_day: number | null
          price_per_month: number | null
          price_per_week: number | null
          slot_name: string
          slot_size: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_concurrent_ads?: number | null
          price_per_custom?: number | null
          price_per_day?: number | null
          price_per_month?: number | null
          price_per_week?: number | null
          slot_name: string
          slot_size: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_concurrent_ads?: number | null
          price_per_custom?: number | null
          price_per_day?: number | null
          price_per_month?: number | null
          price_per_week?: number | null
          slot_name?: string
          slot_size?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_artifacts: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          kind: string
          owner_id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind: string
          owner_id: string
          payload?: Json
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: string
          owner_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decisions: {
        Row: {
          adari_vote: string | null
          boogieman_vote: string | null
          created_at: string | null
          dr_eams_vote: string | null
          id: string
          status: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          adari_vote?: string | null
          boogieman_vote?: string | null
          created_at?: string | null
          dr_eams_vote?: string | null
          id?: string
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          adari_vote?: string | null
          boogieman_vote?: string | null
          created_at?: string | null
          dr_eams_vote?: string | null
          id?: string
          status?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          job_type: string
          output: Json | null
          owner_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["ai_job_status"]
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          job_type: string
          output?: Json | null
          owner_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          job_type?: string
          output?: Json | null
          owner_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
        }
        Relationships: []
      }
      album_content: {
        Row: {
          album_id: string
          content_object_id: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          album_id: string
          content_object_id: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          album_id?: string
          content_object_id?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "album_content_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_content_content_object_id_fkey"
            columns: ["content_object_id"]
            isOneToOne: false
            referencedRelation: "content_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string | null
          id: string
          likes_count: number
          media_json: Json | null
          media_urls: string[]
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number
          media_json?: Json | null
          media_urls?: string[]
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number
          media_json?: Json | null
          media_urls?: string[]
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          object_id: string | null
          object_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          object_id?: string | null
          object_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          object_id?: string | null
          object_type?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          owner_id: string
          schedule: Json
          spec: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          owner_id: string
          schedule?: Json
          spec?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          owner_id?: string
          schedule?: Json
          spec?: Json
          updated_at?: string
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          collection_widget_id: string
          created_at: string
          id: string
          item_widget_id: string
          sort_order: number
        }
        Insert: {
          collection_widget_id: string
          created_at?: string
          id?: string
          item_widget_id: string
          sort_order?: number
        }
        Update: {
          collection_widget_id?: string
          created_at?: string
          id?: string
          item_widget_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_widget_id_fkey"
            columns: ["collection_widget_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["widget_id"]
          },
          {
            foreignKeyName: "collection_items_item_widget_id_fkey"
            columns: ["item_widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          title: string | null
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          title?: string | null
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          title?: string | null
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "app_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confirm_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          intent_ids: string[] | null
          request_id: string | null
          token: string
          ui_snapshot: Json | null
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          intent_ids?: string[] | null
          request_id?: string | null
          token: string
          ui_snapshot?: Json | null
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          intent_ids?: string[] | null
          request_id?: string | null
          token?: string
          ui_snapshot?: Json | null
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      connectors_tokens: {
        Row: {
          created_at: string
          id: string
          provider: string
          token: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider: string
          token: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider?: string
          token?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connectors_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_embed: {
        Row: {
          created_at: string
          embed_html: string | null
          provider: string
          updated_at: string
          url: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          embed_html?: string | null
          provider: string
          updated_at?: string
          url: string
          widget_id: string
        }
        Update: {
          created_at?: string
          embed_html?: string | null
          provider?: string
          updated_at?: string
          url?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_embed_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      content_media: {
        Row: {
          bytes: number | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          media_type: string
          mime_type: string | null
          storage_bucket: string
          storage_path: string
          updated_at: string
          widget_id: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          media_type: string
          mime_type?: string | null
          storage_bucket: string
          storage_path: string
          updated_at?: string
          widget_id: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          media_type?: string
          mime_type?: string | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          widget_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_media_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      content_objects: {
        Row: {
          created_at: string
          id: string
          kind: string
          owner_id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          owner_id: string
          payload?: Json
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          owner_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "content_objects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_text: {
        Row: {
          created_at: string
          format: string
          text: string
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          format?: string
          text: string
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          format?: string
          text?: string
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_text_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant1_id: string
          participant2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant1_id: string
          participant2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant1_id?: string
          participant2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant1_id_fkey"
            columns: ["participant1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant2_id_fkey"
            columns: ["participant2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_configs: {
        Row: {
          created_at: string
          horizon: string
          max_items: number
          sources: Json
          updated_at: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          horizon?: string
          max_items?: number
          sources?: Json
          updated_at?: string
          widget_id: string
        }
        Update: {
          created_at?: string
          horizon?: string
          max_items?: number
          sources?: Json
          updated_at?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_configs_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          created_at: string
          feed_widget_id: string
          id: string
          preview: Json
          source_widget_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          feed_widget_id: string
          id?: string
          preview?: Json
          source_widget_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          feed_widget_id?: string
          id?: string
          preview?: Json
          source_widget_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_feed_widget_id_fkey"
            columns: ["feed_widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_items_source_widget_id_fkey"
            columns: ["source_widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_rules: {
        Row: {
          created_at: string
          id: string
          rule_data: Json
          rule_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rule_data?: Json
          rule_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rule_data?: Json
          rule_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flagged_content: {
        Row: {
          action_taken: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flagged_content_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flagged_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      function_invocations: {
        Row: {
          actor_id: string | null
          created_at: string
          error: string | null
          function_name: string
          id: string
          input: Json
          ok: boolean
          output: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          error?: string | null
          function_name: string
          id?: string
          input?: Json
          ok?: boolean
          output?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          error?: string | null
          function_name?: string
          id?: string
          input?: Json
          ok?: boolean
          output?: Json | null
        }
        Relationships: []
      }
      game_assets: {
        Row: {
          asset_type: string
          config_dna: Json | null
          created_at: string
          id: string
          label: string
          owner_id: string
          source_image_url: string | null
          wasm_mesh_data: string | null
          wasm_rig_data: string | null
        }
        Insert: {
          asset_type?: string
          config_dna?: Json | null
          created_at?: string
          id?: string
          label: string
          owner_id: string
          source_image_url?: string | null
          wasm_mesh_data?: string | null
          wasm_rig_data?: string | null
        }
        Update: {
          asset_type?: string
          config_dna?: Json | null
          created_at?: string
          id?: string
          label?: string
          owner_id?: string
          source_image_url?: string | null
          wasm_mesh_data?: string | null
          wasm_rig_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          achieved_at: string
          game: string
          id: string
          level: number | null
          score: number
          user_id: string
        }
        Insert: {
          achieved_at?: string
          game: string
          id?: string
          level?: number | null
          score: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          game?: string
          id?: string
          level?: number | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_registry: {
        Row: {
          created_at: string
          id: string
          internal_id: string
          label: string
          object_type: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          internal_id: string
          label: string
          object_type: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          internal_id?: string
          label?: string
          object_type?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_registry_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          id: string
          intent_type: string | null
          key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_type?: string | null
          key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_type?: string | null
          key?: string
          user_id?: string
        }
        Relationships: []
      }
      journey_dots: {
        Row: {
          id: string
          user_id: string
          kind: string
          surface: string
          label: string
          significance: number
          domain_color: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: string
          surface?: string
          label: string
          significance?: number
          domain_color?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          surface?: string
          label?: string
          significance?: number
          domain_color?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "app_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merch: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          payment_method: string | null
          product_id: string
          quantity: number | null
          seller_id: string
          shipping_address: Json | null
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          product_id: string
          quantity?: number | null
          seller_id: string
          shipping_address?: Json | null
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string
          quantity?: number | null
          seller_id?: string
          shipping_address?: Json | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merch_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merch_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "merch_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merch_orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_products: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          digital_download_url: string | null
          id: string
          image_url: string | null
          inventory: number | null
          is_digital: boolean | null
          price: number
          sales: number | null
          sku: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital_download_url?: string | null
          id?: string
          image_url?: string | null
          inventory?: number | null
          is_digital?: boolean | null
          price: number
          sales?: number | null
          sku?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital_download_url?: string | null
          id?: string
          image_url?: string | null
          inventory?: number | null
          is_digital?: boolean | null
          price?: number
          sales?: number | null
          sku?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          flagged: boolean | null
          id: string
          is_read: boolean | null
          read: boolean | null
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          is_read?: boolean | null
          read?: boolean | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          flagged?: boolean | null
          id?: string
          is_read?: boolean | null
          read?: boolean | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action_taken: string | null
          content_id: string | null
          created_at: string | null
          id: string
          matched_rule_ids: string[] | null
          policy_version: string | null
        }
        Insert: {
          action_taken?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          matched_rule_ids?: string[] | null
          policy_version?: string | null
        }
        Update: {
          action_taken?: string | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          matched_rule_ids?: string[] | null
          policy_version?: string | null
        }
        Relationships: []
      }
      music_projects: {
        Row: {
          bpm: number | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          key: string | null
          metadata: Json | null
          preview_url: string | null
          title: string
          tracks: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          key?: string | null
          metadata?: Json | null
          preview_url?: string | null
          title: string
          tracks?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bpm?: number | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          key?: string | null
          metadata?: Json | null
          preview_url?: string | null
          title?: string
          tracks?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      music_releases: {
        Row: {
          audio_bytes: number | null
          audio_mime: string | null
          audio_path: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          embed_url: string | null
          id: string
          likes_count: number
          owner_id: string | null
          plays_count: number
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          audio_bytes?: number | null
          audio_mime?: string | null
          audio_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          likes_count?: number
          owner_id?: string | null
          plays_count?: number
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          audio_bytes?: number | null
          audio_mime?: string | null
          audio_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          likes_count?: number
          owner_id?: string | null
          plays_count?: number
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_releases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_state: {
        Row: {
          angle_x: number | null
          angle_y: number | null
          current_face: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          angle_x?: number | null
          angle_y?: number | null
          current_face?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          angle_x?: number | null
          angle_y?: number | null
          current_face?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: number
          title: string
        }
        Insert: {
          id?: number
          title: string
        }
        Update: {
          id?: number
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          message: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      physics_experiments: {
        Row: {
          created_at: string
          creator_id: string | null
          description: string | null
          hypothesis: string | null
          id: string
          methodology: Json | null
          parameters: Json | null
          performance_metrics: Json | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          hypothesis?: string | null
          id?: string
          methodology?: Json | null
          parameters?: Json | null
          performance_metrics?: Json | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          description?: string | null
          hypothesis?: string | null
          id?: string
          methodology?: Json | null
          parameters?: Json | null
          performance_metrics?: Json | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "physics_experiments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          activated_at: string | null
          description: string | null
          id: string
          version_tag: string | null
        }
        Insert: {
          activated_at?: string | null
          description?: string | null
          id?: string
          version_tag?: string | null
        }
        Update: {
          activated_at?: string | null
          description?: string | null
          id?: string
          version_tag?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          handle: string
          has_seen_intro: boolean
          id: string
          location: string | null
          updated_at: string
          website: string | null
          widget_config: Json
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle: string
          has_seen_intro?: boolean
          id: string
          location?: string | null
          updated_at?: string
          website?: string | null
          widget_config?: Json
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string
          has_seen_intro?: boolean
          id?: string
          location?: string | null
          updated_at?: string
          website?: string | null
          widget_config?: Json
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      science_experiments: {
        Row: {
          created_at: string | null
          dataset_url: string | null
          description: string | null
          id: string
          results: Json | null
          simulation_config: Json | null
          simulation_output: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dataset_url?: string | null
          description?: string | null
          id?: string
          results?: Json | null
          simulation_config?: Json | null
          simulation_output?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dataset_url?: string | null
          description?: string | null
          id?: string
          results?: Json | null
          simulation_config?: Json | null
          simulation_output?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "science_experiments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          metadata: Json
          owner_id: string
          price_cents: number
          status: string
          stock: number
          tags: string[]
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          owner_id?: string
          price_cents: number
          status?: string
          stock?: number
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json
          owner_id?: string
          price_cents?: number
          status?: string
          stock?: number
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      space_members: {
        Row: {
          created_at: string
          role: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          kind: Database["public"]["Enums"]["space_kind"]
          name: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          kind: Database["public"]["Enums"]["space_kind"]
          name?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          kind?: Database["public"]["Enums"]["space_kind"]
          name?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          id: string
          payment_method: string | null
          payment_proof: string | null
          reference_id: string | null
          seller_id: string | null
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_proof?: string | null
          reference_id?: string | null
          seller_id?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          id?: string
          payment_method?: string | null
          payment_proof?: string | null
          reference_id?: string | null
          seller_id?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: []
      }
      user_revenue: {
        Row: {
          id: string
          last_payout_date: string | null
          paid_out: number | null
          payout_method: string | null
          pending_payout: number | null
          total_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_payout_date?: string | null
          paid_out?: number | null
          payout_method?: string | null
          pending_payout?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_payout_date?: string | null
          paid_out?: number | null
          payout_method?: string | null
          pending_payout?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_revenue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_content: {
        Row: {
          content: Json
          content_body: string | null
          content_encoding: string | null
          content_hash: string | null
          created_at: string
          id: string
          metadata: Json | null
          owner_id: string | null
          updated_at: string
          widget_id: string | null
        }
        Insert: {
          content?: Json
          content_body?: string | null
          content_encoding?: string | null
          content_hash?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          owner_id?: string | null
          updated_at?: string
          widget_id?: string | null
        }
        Update: {
          content?: Json
          content_body?: string | null
          content_encoding?: string | null
          content_hash?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          owner_id?: string | null
          updated_at?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_content_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: true
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_definitions: {
        Row: {
          component: string | null
          created_at: string
          default_config: Json
          description: string | null
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          component?: string | null
          created_at?: string
          default_config?: Json
          description?: string | null
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          component?: string | null
          created_at?: string
          default_config?: Json
          description?: string | null
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      widget_events: {
        Row: {
          actor_id: string | null
          channel: string | null
          event_type: string | null
          id: string
          payload: Json | null
          timestamp: string | null
          type: string | null
          widget_id: string | null
          widget_instance_id: string | null
        }
        Insert: {
          actor_id?: string | null
          channel?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          timestamp?: string | null
          type?: string | null
          widget_id?: string | null
          widget_instance_id?: string | null
        }
        Update: {
          actor_id?: string | null
          channel?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          timestamp?: string | null
          type?: string | null
          widget_id?: string | null
          widget_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_events_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_follows: {
        Row: {
          created_at: string
          user_id: string
          widget_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          widget_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_follows_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_instances: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_instances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_instances_widget_type_fkey"
            columns: ["widget_type"]
            isOneToOne: false
            referencedRelation: "widget_definitions"
            referencedColumns: ["key"]
          },
        ]
      }
      widget_layouts: {
        Row: {
          created_at: string
          h: number
          id: string
          rail_angle: number | null
          rot_x: number
          rot_y: number
          rot_z: number
          rotation: number
          scale: number
          slot_index: number
          surface_key: string | null
          updated_at: string
          viewport: Database["public"]["Enums"]["viewport_kind"]
          w: number
          widget_id: string
          x: number
          y: number
          z: number
          z_index: number
        }
        Insert: {
          created_at?: string
          h?: number
          id?: string
          rail_angle?: number | null
          rot_x?: number
          rot_y?: number
          rot_z?: number
          rotation?: number
          scale?: number
          slot_index?: number
          surface_key?: string | null
          updated_at?: string
          viewport: Database["public"]["Enums"]["viewport_kind"]
          w?: number
          widget_id: string
          x?: number
          y?: number
          z?: number
          z_index?: number
        }
        Update: {
          created_at?: string
          h?: number
          id?: string
          rail_angle?: number | null
          rot_x?: number
          rot_y?: number
          rot_z?: number
          rotation?: number
          scale?: number
          slot_index?: number
          surface_key?: string | null
          updated_at?: string
          viewport?: Database["public"]["Enums"]["viewport_kind"]
          w?: number
          widget_id?: string
          x?: number
          y?: number
          z?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_layouts_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_metrics: {
        Row: {
          interaction_count: number | null
          last_used: string | null
          user_id: string | null
          widget_id: string | null
        }
        Insert: {
          interaction_count?: number | null
          last_used?: string | null
          user_id?: string | null
          widget_id?: string | null
        }
        Update: {
          interaction_count?: number | null
          last_used?: string | null
          user_id?: string | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_metrics_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          layout: Json | null
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      widget_shares: {
        Row: {
          copied_widget_id: string
          created_at: string
          created_by: string
          id: string
          source_space_id: string
          source_widget_id: string
          target_space_id: string
        }
        Insert: {
          copied_widget_id: string
          created_at?: string
          created_by: string
          id?: string
          source_space_id: string
          source_widget_id: string
          target_space_id: string
        }
        Update: {
          copied_widget_id?: string
          created_at?: string
          created_by?: string
          id?: string
          source_space_id?: string
          source_widget_id?: string
          target_space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_shares_copied_widget_id_fkey"
            columns: ["copied_widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_shares_source_space_id_fkey"
            columns: ["source_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_shares_source_widget_id_fkey"
            columns: ["source_widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_shares_target_space_id_fkey"
            columns: ["target_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_types: {
        Row: {
          config_schema: Json
          content_kind: Database["public"]["Enums"]["content_kind"]
          created_at: string
          id: string
          settings_schema: Json
          type_key: string
          version: string
        }
        Insert: {
          config_schema?: Json
          content_kind: Database["public"]["Enums"]["content_kind"]
          created_at?: string
          id?: string
          settings_schema?: Json
          type_key: string
          version?: string
        }
        Update: {
          config_schema?: Json
          content_kind?: Database["public"]["Enums"]["content_kind"]
          created_at?: string
          id?: string
          settings_schema?: Json
          type_key?: string
          version?: string
        }
        Relationships: []
      }
      widgets: {
        Row: {
          archived: boolean
          config: Json
          created_at: string
          id: string
          owner_id: string
          settings: Json
          space_id: string
          title: string | null
          type_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["widget_visibility"]
        }
        Insert: {
          archived?: boolean
          config?: Json
          created_at?: string
          id?: string
          owner_id: string
          settings?: Json
          space_id: string
          title?: string | null
          type_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["widget_visibility"]
        }
        Update: {
          archived?: boolean
          config?: Json
          created_at?: string
          id?: string
          owner_id?: string
          settings?: Json
          space_id?: string
          title?: string | null
          type_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["widget_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "widgets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widgets_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "widget_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_user_spaces: { Args: { p_user_id: string }; Returns: undefined }
      calculate_aqs: { Args: { p_user_id: string }; Returns: number }
      calculate_visibility_score: { Args: { p_post_id: string }; Returns: number }
      check_ai_rate_limit: {
        Args: {
          p_user_id: string
          p_endpoint: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: {
          allowed: boolean
          rpm: number
          retry_after_seconds: number | null
        }
      }
      get_user_metrics: { Args: { p_user_id: string }; Returns: Json }
      get_user_capabilities: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      increment_likes: {
        Args: { row_id: string; table_name: string }
        Returns: undefined
      }
      match_content_embeddings: {
        Args: {
          query_embedding: string
          match_count?: number
          max_distance?: number
          filter_content_type?: string | null
        }
        Returns: {
          content_id: string
          content_type: string
          owner_id: string
          distance: number
        }[]
      }
      verify_ad_view: {
        Args: {
          p_ad_id: string
          p_viewer_id: string
          p_watched_pct: number
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_owner: { Args: never; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_premium: { Args: never; Returns: boolean }
      jwt_role: { Args: never; Returns: string }
    }
    Enums: {
      ai_job_status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"
      content_kind:
        | "TEXT"
        | "MEDIA"
        | "EMBED"
        | "COLLECTION"
        | "FEED"
        | "SYSTEM"
      space_kind: "HOME" | "PROFILE" | "TEAM"
      viewport_kind: "MOBILE" | "TABLET" | "DESKTOP"
      widget_visibility: "PRIVATE" | "TEAM" | "PUBLIC"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          instance_id: string | null
          id: string
          payload: Json | null
          created_at: string | null
          ip_address: string
        }
        Insert: {
          instance_id?: string | null
          id: string
          payload?: Json | null
          created_at?: string | null
          ip_address?: string
        }
        Update: {
          instance_id?: string | null
          id?: string
          payload?: Json | null
          created_at?: string | null
          ip_address?: string
        }
        Relationships: []
      }
      custom_oauth_providers: {
        Row: {
          id: string
          provider_type: string
          identifier: string
          name: string
          client_id: string
          client_secret: string
          acceptable_client_ids: string[]
          scopes: string[]
          pkce_enabled: boolean
          attribute_mapping: Json
          authorization_params: Json
          enabled: boolean
          email_optional: boolean
          issuer: string | null
          discovery_url: string | null
          skip_nonce_check: boolean
          cached_discovery: Json | null
          discovery_cached_at: string | null
          authorization_url: string | null
          token_url: string | null
          userinfo_url: string | null
          jwks_uri: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_type: string
          identifier: string
          name: string
          client_id: string
          client_secret: string
          acceptable_client_ids?: string[]
          scopes?: string[]
          pkce_enabled?: boolean
          attribute_mapping?: Json
          authorization_params?: Json
          enabled?: boolean
          email_optional?: boolean
          issuer?: string | null
          discovery_url?: string | null
          skip_nonce_check?: boolean
          cached_discovery?: Json | null
          discovery_cached_at?: string | null
          authorization_url?: string | null
          token_url?: string | null
          userinfo_url?: string | null
          jwks_uri?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_type?: string
          identifier?: string
          name?: string
          client_id?: string
          client_secret?: string
          acceptable_client_ids?: string[]
          scopes?: string[]
          pkce_enabled?: boolean
          attribute_mapping?: Json
          authorization_params?: Json
          enabled?: boolean
          email_optional?: boolean
          issuer?: string | null
          discovery_url?: string | null
          skip_nonce_check?: boolean
          cached_discovery?: Json | null
          discovery_cached_at?: string | null
          authorization_url?: string | null
          token_url?: string | null
          userinfo_url?: string | null
          jwks_uri?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          id: string
          user_id: string | null
          auth_code: string | null
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"] | null
          code_challenge: string | null
          provider_type: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          created_at: string | null
          updated_at: string | null
          authentication_method: string
          auth_code_issued_at: string | null
          invite_token: string | null
          referrer: string | null
          oauth_client_state_id: string | null
          linking_target_id: string | null
          email_optional: boolean
        }
        Insert: {
          id: string
          user_id?: string | null
          auth_code?: string | null
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"] | null
          code_challenge?: string | null
          provider_type: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          created_at?: string | null
          updated_at?: string | null
          authentication_method: string
          auth_code_issued_at?: string | null
          invite_token?: string | null
          referrer?: string | null
          oauth_client_state_id?: string | null
          linking_target_id?: string | null
          email_optional?: boolean
        }
        Update: {
          id?: string
          user_id?: string | null
          auth_code?: string | null
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"] | null
          code_challenge?: string | null
          provider_type?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          created_at?: string | null
          updated_at?: string | null
          authentication_method?: string
          auth_code_issued_at?: string | null
          invite_token?: string | null
          referrer?: string | null
          oauth_client_state_id?: string | null
          linking_target_id?: string | null
          email_optional?: boolean
        }
        Relationships: []
      }
      identities: {
        Row: {
          provider_id: string
          user_id: string
          identity_data: Json
          provider: string
          last_sign_in_at: string | null
          created_at: string | null
          updated_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          provider_id: string
          user_id: string
          identity_data: Json
          provider: string
          last_sign_in_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          id?: string
        }
        Update: {
          provider_id?: string
          user_id?: string
          identity_data?: Json
          provider?: string
          last_sign_in_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      instances: {
        Row: {
          id: string
          uuid: string | null
          raw_base_config: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          uuid?: string | null
          raw_base_config?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          uuid?: string | null
          raw_base_config?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          session_id: string
          created_at: string
          updated_at: string
          authentication_method: string
          id: string
        }
        Insert: {
          session_id: string
          created_at: string
          updated_at: string
          authentication_method: string
          id: string
        }
        Update: {
          session_id?: string
          created_at?: string
          updated_at?: string
          authentication_method?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_challenges: {
        Row: {
          id: string
          factor_id: string
          created_at: string
          verified_at: string | null
          ip_address: string
          otp_code: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          id: string
          factor_id: string
          created_at: string
          verified_at?: string | null
          ip_address: string
          otp_code?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          id?: string
          factor_id?: string
          created_at?: string
          verified_at?: string | null
          ip_address?: string
          otp_code?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          }
        ]
      }
      mfa_factors: {
        Row: {
          id: string
          user_id: string
          friendly_name: string | null
          factor_type: Database["auth"]["Enums"]["factor_type"]
          status: Database["auth"]["Enums"]["factor_status"]
          created_at: string
          updated_at: string
          secret: string | null
          phone: string | null
          last_challenged_at: string | null
          web_authn_credential: Json | null
          web_authn_aaguid: string | null
          last_webauthn_challenge_data: Json | null
        }
        Insert: {
          id: string
          user_id: string
          friendly_name?: string | null
          factor_type: Database["auth"]["Enums"]["factor_type"]
          status: Database["auth"]["Enums"]["factor_status"]
          created_at: string
          updated_at: string
          secret?: string | null
          phone?: string | null
          last_challenged_at?: string | null
          web_authn_credential?: Json | null
          web_authn_aaguid?: string | null
          last_webauthn_challenge_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          friendly_name?: string | null
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          status?: Database["auth"]["Enums"]["factor_status"]
          created_at?: string
          updated_at?: string
          secret?: string | null
          phone?: string | null
          last_challenged_at?: string | null
          web_authn_credential?: Json | null
          web_authn_aaguid?: string | null
          last_webauthn_challenge_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      oauth_authorizations: {
        Row: {
          id: string
          authorization_id: string
          client_id: string
          user_id: string | null
          redirect_uri: string
          scope: string
          state: string | null
          resource: string | null
          code_challenge: string | null
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"] | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          authorization_code: string | null
          created_at: string
          expires_at: string
          approved_at: string | null
          nonce: string | null
        }
        Insert: {
          id: string
          authorization_id: string
          client_id: string
          user_id?: string | null
          redirect_uri: string
          scope: string
          state?: string | null
          resource?: string | null
          code_challenge?: string | null
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"] | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          authorization_code?: string | null
          created_at?: string
          expires_at?: string
          approved_at?: string | null
          nonce?: string | null
        }
        Update: {
          id?: string
          authorization_id?: string
          client_id?: string
          user_id?: string | null
          redirect_uri?: string
          scope?: string
          state?: string | null
          resource?: string | null
          code_challenge?: string | null
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"] | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          authorization_code?: string | null
          created_at?: string
          expires_at?: string
          approved_at?: string | null
          nonce?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      oauth_client_states: {
        Row: {
          id: string
          provider_type: string
          code_verifier: string | null
          created_at: string
        }
        Insert: {
          id: string
          provider_type: string
          code_verifier?: string | null
          created_at: string
        }
        Update: {
          id?: string
          provider_type?: string
          code_verifier?: string | null
          created_at?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          id: string
          client_secret_hash: string | null
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          redirect_uris: string
          grant_types: string
          client_name: string | null
          client_uri: string | null
          logo_uri: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          token_endpoint_auth_method: string
        }
        Insert: {
          id: string
          client_secret_hash?: string | null
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          redirect_uris: string
          grant_types: string
          client_name?: string | null
          client_uri?: string | null
          logo_uri?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          token_endpoint_auth_method: string
        }
        Update: {
          id?: string
          client_secret_hash?: string | null
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          redirect_uris?: string
          grant_types?: string
          client_name?: string | null
          client_uri?: string | null
          logo_uri?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          token_endpoint_auth_method?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          id: string
          user_id: string
          client_id: string
          scopes: string
          granted_at: string
          revoked_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          client_id: string
          scopes: string
          granted_at?: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          scopes?: string
          granted_at?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      one_time_tokens: {
        Row: {
          id: string
          user_id: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          token_hash: string
          relates_to: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          token_hash: string
          relates_to: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          token_hash?: string
          relates_to?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      refresh_tokens: {
        Row: {
          instance_id: string | null
          id: number
          token: string | null
          user_id: string | null
          revoked: boolean | null
          created_at: string | null
          updated_at: string | null
          parent: string | null
          session_id: string | null
        }
        Insert: {
          instance_id?: string | null
          id?: number
          token?: string | null
          user_id?: string | null
          revoked?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parent?: string | null
          session_id?: string | null
        }
        Update: {
          instance_id?: string | null
          id?: number
          token?: string | null
          user_id?: string | null
          revoked?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          parent?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      saml_providers: {
        Row: {
          id: string
          sso_provider_id: string
          entity_id: string
          metadata_xml: string
          metadata_url: string | null
          attribute_mapping: Json | null
          created_at: string | null
          updated_at: string | null
          name_id_format: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          entity_id: string
          metadata_xml: string
          metadata_url?: string | null
          attribute_mapping?: Json | null
          created_at?: string | null
          updated_at?: string | null
          name_id_format?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          entity_id?: string
          metadata_xml?: string
          metadata_url?: string | null
          attribute_mapping?: Json | null
          created_at?: string | null
          updated_at?: string | null
          name_id_format?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          }
        ]
      }
      saml_relay_states: {
        Row: {
          id: string
          sso_provider_id: string
          request_id: string
          for_email: string | null
          redirect_to: string | null
          created_at: string | null
          updated_at: string | null
          flow_state_id: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          request_id: string
          for_email?: string | null
          redirect_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          flow_state_id?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          request_id?: string
          for_email?: string | null
          redirect_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          flow_state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          }
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string | null
          updated_at: string | null
          factor_id: string | null
          aal: Database["auth"]["Enums"]["aal_level"] | null
          not_after: string | null
          refreshed_at: string | null
          user_agent: string | null
          ip: string | null
          tag: string | null
          oauth_client_id: string | null
          refresh_token_hmac_key: string | null
          refresh_token_counter: number | null
          scopes: string | null
        }
        Insert: {
          id: string
          user_id: string
          created_at?: string | null
          updated_at?: string | null
          factor_id?: string | null
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          not_after?: string | null
          refreshed_at?: string | null
          user_agent?: string | null
          ip?: string | null
          tag?: string | null
          oauth_client_id?: string | null
          refresh_token_hmac_key?: string | null
          refresh_token_counter?: number | null
          scopes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string | null
          updated_at?: string | null
          factor_id?: string | null
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          not_after?: string | null
          refreshed_at?: string | null
          user_agent?: string | null
          ip?: string | null
          tag?: string | null
          oauth_client_id?: string | null
          refresh_token_hmac_key?: string | null
          refresh_token_counter?: number | null
          scopes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          }
        ]
      }
      sso_domains: {
        Row: {
          id: string
          sso_provider_id: string
          domain: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          sso_provider_id: string
          domain: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          sso_provider_id?: string
          domain?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          }
        ]
      }
      sso_providers: {
        Row: {
          id: string
          resource_id: string | null
          created_at: string | null
          updated_at: string | null
          disabled: boolean | null
        }
        Insert: {
          id: string
          resource_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          disabled?: boolean | null
        }
        Update: {
          id?: string
          resource_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          disabled?: boolean | null
        }
        Relationships: []
      }
      users: {
        Row: {
          instance_id: string | null
          id: string
          aud: string | null
          role: string | null
          email: string | null
          encrypted_password: string | null
          email_confirmed_at: string | null
          invited_at: string | null
          confirmation_token: string | null
          confirmation_sent_at: string | null
          recovery_token: string | null
          recovery_sent_at: string | null
          email_change_token_new: string | null
          email_change: string | null
          email_change_sent_at: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean | null
          created_at: string | null
          updated_at: string | null
          phone: string | null
          phone_confirmed_at: string | null
          phone_change: string
          phone_change_token: string
          phone_change_sent_at: string | null
          confirmed_at: string | null
          email_change_token_current: string
          email_change_confirm_status: number
          banned_until: string | null
          reauthentication_token: string
          reauthentication_sent_at: string | null
          is_sso_user: boolean
          deleted_at: string | null
          is_anonymous: boolean
        }
        Insert: {
          instance_id?: string | null
          id: string
          aud?: string | null
          role?: string | null
          email?: string | null
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string
          phone_change_token?: string
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string
          email_change_confirm_status?: number
          banned_until?: string | null
          reauthentication_token?: string
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
        }
        Update: {
          instance_id?: string | null
          id?: string
          aud?: string | null
          role?: string | null
          email?: string | null
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          invited_at?: string | null
          confirmation_token?: string | null
          confirmation_sent_at?: string | null
          recovery_token?: string | null
          recovery_sent_at?: string | null
          email_change_token_new?: string | null
          email_change?: string | null
          email_change_sent_at?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          phone?: string | null
          phone_confirmed_at?: string | null
          phone_change?: string
          phone_change_token?: string
          phone_change_sent_at?: string | null
          confirmed_at?: string | null
          email_change_token_current?: string
          email_change_confirm_status?: number
          banned_until?: string | null
          reauthentication_token?: string
          reauthentication_sent_at?: string | null
          is_sso_user?: boolean
          deleted_at?: string | null
          is_anonymous?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "rejected" | "expired"
      oauth_client_type: "confidential" | "public"
      oauth_registration_type: "dynamic" | "static"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_job_status: ["QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"],
      content_kind: ["TEXT", "MEDIA", "EMBED", "COLLECTION", "FEED", "SYSTEM"],
      space_kind: ["HOME", "PROFILE", "TEAM"],
      viewport_kind: ["MOBILE", "TABLET", "DESKTOP"],
      widget_visibility: ["PRIVATE", "TEAM", "PUBLIC"],
    },
  },
} as const
