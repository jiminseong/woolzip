// Database types generated from Supabase schema
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          locale: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          locale?: string | null;
          created_at?: string | null;
        };
      };
      families: {
        Row: {
          id: string;
          name: string | null;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          created_by?: string | null;
          created_at?: string | null;
        };
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: "parent" | "child" | "sibling" | null;
          is_active: boolean | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: "parent" | "child" | "sibling" | null;
          is_active?: boolean | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: "parent" | "child" | "sibling" | null;
          is_active?: boolean | null;
          joined_at?: string | null;
        };
      };
      signals: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          type: "green" | "yellow" | "red";
          tag: "meal" | "home" | "leave" | "sleep" | "wake" | "sos" | null;
          note: string | null;
          created_at: string | null;
          undo_until: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          type: "green" | "yellow" | "red";
          tag?: "meal" | "home" | "leave" | "sleep" | "wake" | "sos" | null;
          note?: string | null;
          created_at?: string | null;
          undo_until?: string | null;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          type?: "green" | "yellow" | "red";
          tag?: "meal" | "home" | "leave" | "sleep" | "wake" | "sos" | null;
          note?: string | null;
          created_at?: string | null;
          undo_until?: string | null;
        };
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          times: string[] | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          times?: string[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          times?: string[] | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
      };
      med_logs: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          medication_id: string;
          time_slot: "morning" | "noon" | "evening" | null;
          taken_at: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          medication_id: string;
          time_slot?: "morning" | "noon" | "evening" | null;
          taken_at?: string | null;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          medication_id?: string;
          time_slot?: "morning" | "noon" | "evening" | null;
          taken_at?: string | null;
        };
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          share_signals: boolean | null;
          share_meds: boolean | null;
          share_emotion: boolean | null;
          font_scale: string | null;
          high_contrast: boolean | null;
          push_opt_in: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_signals?: boolean | null;
          share_meds?: boolean | null;
          share_emotion?: boolean | null;
          font_scale?: string | null;
          high_contrast?: boolean | null;
          push_opt_in?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_signals?: boolean | null;
          share_meds?: boolean | null;
          share_emotion?: boolean | null;
          font_scale?: string | null;
          high_contrast?: boolean | null;
          push_opt_in?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      invites: {
        Row: {
          code: string;
          family_id: string;
          created_by: string | null;
          expires_at: string | null;
          used_by: string | null;
          created_at: string | null;
        };
        Insert: {
          code: string;
          family_id: string;
          created_by?: string | null;
          expires_at?: string | null;
          used_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          code?: string;
          family_id?: string;
          created_by?: string | null;
          expires_at?: string | null;
          used_by?: string | null;
          created_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
