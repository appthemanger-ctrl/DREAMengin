export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ad_creatives: {
        Row: {
          id: string
          user_id: string
          text: string | null
          image_url: string | null
          link: string | null
        }
        Insert: {
          id?: string
          user_id: string
          text?: string | null
          image_url?: string | null
          link?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          text?: string | null
          image_url?: string | null
          link?: string | null
        }
      }
      ad_events: {
        Row: {
          id: string
          order_id: string
          type: string | null
          ts: string
        }
        Insert: {
          id?: string
          order_id: string
          type?: string | null
          ts?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: string | null
          ts?: string
        }
      }
      ad_listings: {
        Row: {
          id: string
          slot_id: string
          start_date: string | null
          end_date: string | null
          status: string
        }
        Insert: {
          id?: string
          slot_id: string
          start_date?: string | null
          end_date?: string | null
          status?: string
        }
        Update: {
          id?: string
          slot_id?: string
          start_date?: string | null
          end_date?: string | null
          status?: string
        }
      }
      ad_orders: {
        Row: {
          id: string
          buyer_id: string
          listing_id: string
          creative_id: string | null
          payment_status: string
          revenue_share: number
        }
        Insert: {
          id?: string
          buyer_id: string
          listing_id: string
          creative_id?: string | null
          payment_status?: string
          revenue_share?: number
        }
        Update: {
          id?: string
          buyer_id?: string
          listing_id?: string
          creative_id?: string | null
          payment_status?: string
          revenue_share?: number
        }
      }
      ad_slots: {
        Row: {
          id: string
          owner_id: string
          placement: string | null
          price_day: number | null
          price_week: number | null
          active: boolean
        }
        Insert: {
          id?: string
          owner_id: string
          placement?: string | null
          price_day?: number | null
          price_week?: number | null
          active?: boolean
        }
        Update: {
          id?: string
          owner_id?: string
          placement?: string | null
          price_day?: number | null
          price_week?: number | null
          active?: boolean
        }
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string | null
          details: Json | null
          ts: string
        }
        Insert: {
          id?: string
          admin_id: string
          action?: string | null
          details?: Json | null
          ts?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string | null
          details?: Json | null
          ts?: string
        }
      }
      app_posts: {
        Row: {
          id: string
          user_id: string
          content: string | null
          media_json: Json | null
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content?: string | null
          media_json?: Json | null
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string | null
          media_json?: Json | null
          visibility?: string
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          project_id: string
          storage_path: string | null
          name: string | null
        }
        Insert: {
          id?: string
          project_id: string
          storage_path?: string | null
          name?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          storage_path?: string | null
          name?: string | null
        }
      }
      connectors_tokens: {
        Row: {
          id: string
          user_id: string
          source: string | null
          token: Json | null
          revoked: boolean
        }
        Insert: {
          id?: string
          user_id: string
          source?: string | null
          token?: Json | null
          revoked?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          source?: string | null
          token?: Json | null
          revoked?: boolean
        }
      }
      feed_items: {
        Row: {
          id: string
          user_id: string
          source: string
          source_account_id: string | null
          external_id: string | null
          ts: string
          title: string | null
          summary: string | null
          url: string | null
          media_json: Json | null
          tags_json: Json | null
          importance_score: number
          visibility: string
          dedupe_hash: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          source_account_id?: string | null
          external_id?: string | null
          ts: string
          title?: string | null
          summary?: string | null
          url?: string | null
          media_json?: Json | null
          tags_json?: Json | null
          importance_score?: number
          visibility?: string
          dedupe_hash: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          source_account_id?: string | null
          external_id?: string | null
          ts?: string
          title?: string | null
          summary?: string | null
          url?: string | null
          media_json?: Json | null
          tags_json?: Json | null
          importance_score?: number
          visibility?: string
          dedupe_hash?: string
        }
      }
      feed_rules: {
        Row: {
          id: string
          user_id: string
          type: string | null
          target: string | null
          value: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type?: string | null
          target?: string | null
          value?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string | null
          target?: string | null
          value?: Json | null
        }
      }
      follows: {
        Row: {
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          followed_id?: string
          created_at?: string
        }
      }
      merch: {
        Row: {
          id: string
          owner_id: string
          title: string | null
          description: string | null
          price: number | null
          image_url: string | null
          stock: number | null
        }
        Insert: {
          id?: string
          owner_id: string
          title?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          stock?: number | null
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          stock?: number | null
        }
      }
      music_releases: {
        Row: {
          id: string
          owner_id: string
          title: string | null
          embed_url: string | null
          upload_path: string | null
          visibility: string
        }
        Insert: {
          id?: string
          owner_id: string
          title?: string | null
          embed_url?: string | null
          upload_path?: string | null
          visibility?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string | null
          embed_url?: string | null
          upload_path?: string | null
          visibility?: string
        }
      }
      notebooks: {
        Row: {
          id: string
          project_id: string
          content: string | null
          version: number
        }
        Insert: {
          id?: string
          project_id: string
          content?: string | null
          version?: number
        }
        Update: {
          id?: string
          project_id?: string
          content?: string | null
          version?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string | null
          content: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type?: string | null
          content?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string | null
          content?: Json | null
          read?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          handle: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          theme: Json | null
          links: Json | null
          privacy: Json | null
          created_at: string
        }
        Insert: {
          id: string
          handle: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          theme?: Json | null
          links?: Json | null
          privacy?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          handle?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          theme?: Json | null
          links?: Json | null
          privacy?: Json | null
          created_at?: string
        }
      }
      project_members: {
        Row: {
          project_id: string
          user_id: string
          role: string
        }
        Insert: {
          project_id: string
          user_id: string
          role?: string
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: string
        }
      }
      projects: {
        Row: {
          id: string
          owner_id: string
          title: string | null
          description: string | null
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title?: string | null
          description?: string | null
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string | null
          description?: string | null
          visibility?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          type: string | null
          data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type?: string | null
          data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string | null
          data?: Json | null
        }
      }
      settings: {
        Row: {
          user_id: string
          data: Json | null
        }
        Insert: {
          user_id: string
          data?: Json | null
        }
        Update: {
          user_id?: string
          data?: Json | null
        }
      }
      widget_instances: {
        Row: {
          id: string
          user_id: string
          type: string
          config_json: Json | null
          order: number | null
          enabled: boolean
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          config_json?: Json | null
          order?: number | null
          enabled?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          config_json?: Json | null
          order?: number | null
          enabled?: boolean
        }
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]