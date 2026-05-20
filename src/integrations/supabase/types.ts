export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_email: string | null
          short_code: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_email?: string | null
          short_code: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_email?: string | null
          short_code?: string
          status?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit: number
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit?: number
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit?: number
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      blocked_urls: {
        Row: {
          created_at: string
          domain: string
          id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      bulk_jobs: {
        Row: {
          created_at: string
          created_count: number
          failed_count: number
          id: string
          name: string
          qr_type: string
          rows: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_count?: number
          failed_count?: number
          id?: string
          name: string
          qr_type?: string
          rows?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_count?: number
          failed_count?: number
          id?: string
          name?: string
          qr_type?: string
          rows?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dynamic_qrs: {
        Row: {
          campaign: string | null
          created_at: string
          destination: string
          ends_at: string | null
          folder_id: string | null
          id: string
          logo_data_url: string | null
          name: string
          notes: string | null
          password_hash: string | null
          qr_type: string
          scan_count: number
          scan_limit: number | null
          short_code: string
          starts_at: string | null
          status: string
          style: Json | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          destination: string
          ends_at?: string | null
          folder_id?: string | null
          id?: string
          logo_data_url?: string | null
          name?: string
          notes?: string | null
          password_hash?: string | null
          qr_type?: string
          scan_count?: number
          scan_limit?: number | null
          short_code: string
          starts_at?: string | null
          status?: string
          style?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign?: string | null
          created_at?: string
          destination?: string
          ends_at?: string | null
          folder_id?: string | null
          id?: string
          logo_data_url?: string | null
          name?: string
          notes?: string | null
          password_hash?: string | null
          qr_type?: string
          scan_count?: number
          scan_limit?: number | null
          short_code?: string
          starts_at?: string | null
          status?: string
          style?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_qrs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          rating: number
          review_text: string
          role: string | null
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          rating?: number
          review_text: string
          role?: string | null
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          rating?: number
          review_text?: string
          role?: string | null
        }
        Relationships: []
      }
      saved_qrs: {
        Row: {
          created_at: string
          id: string
          logo_data_url: string | null
          name: string
          payload: string
          qr_type: string
          style: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_data_url?: string | null
          name?: string
          payload: string
          qr_type?: string
          style?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_data_url?: string | null
          name?: string
          payload?: string
          qr_type?: string
          style?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          destination_used: string | null
          device_type: string | null
          id: string
          language: string | null
          os: string | null
          qr_id: string
          referrer: string | null
          scanned_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_hash: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          destination_used?: string | null
          device_type?: string | null
          id?: string
          language?: string | null
          os?: string | null
          qr_id: string
          referrer?: string | null
          scanned_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_hash?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          destination_used?: string | null
          device_type?: string | null
          id?: string
          language?: string | null
          os?: string | null
          qr_id?: string
          referrer?: string | null
          scanned_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_qr_id_fkey"
            columns: ["qr_id"]
            isOneToOne: false
            referencedRelation: "dynamic_qrs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          logo_data_url: string | null
          name: string
          payload: string
          qr_type: string
          style: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          logo_data_url?: string | null
          name: string
          payload: string
          qr_type?: string
          style?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          logo_data_url?: string | null
          name?: string
          payload?: string
          qr_type?: string
          style?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_scan_count: { Args: { _qr_id: string }; Returns: undefined }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      team_role: "owner" | "admin" | "editor" | "viewer"
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
      app_role: ["admin", "moderator", "user"],
      team_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
