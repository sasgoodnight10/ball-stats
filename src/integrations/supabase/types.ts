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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      games: {
        Row: {
          completed_at: string | null
          created_at: string
          current_rack: number | null
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          player_a_id: string | null
          player_b_id: string | null
          player_mode: Database["public"]["Enums"]["player_mode"]
          started_at: string
          team_a_score: number | null
          team_b_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_rack?: number | null
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          player_a_id?: string | null
          player_b_id?: string | null
          player_mode: Database["public"]["Enums"]["player_mode"]
          started_at?: string
          team_a_score?: number | null
          team_b_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_rack?: number | null
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          player_a_id?: string | null
          player_b_id?: string | null
          player_mode?: Database["public"]["Enums"]["player_mode"]
          started_at?: string
          team_a_score?: number | null
          team_b_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_player_a_id_fkey"
            columns: ["player_a_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_player_b_id_fkey"
            columns: ["player_b_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shots: {
        Row: {
          ball_number: number | null
          balls_pocketed_on_break: number | null
          break_spread_quality: number | null
          confidence_rating: number | null
          created_at: string
          cue_ball_control:
            | Database["public"]["Enums"]["cue_ball_control"]
            | null
          cut_angle: Database["public"]["Enums"]["cut_angle"] | null
          distance: Database["public"]["Enums"]["distance"] | null
          error_type: Database["public"]["Enums"]["error_type"] | null
          game_id: string
          id: string
          is_break_shot: boolean | null
          notes: string | null
          outcome: Database["public"]["Enums"]["shot_outcome"] | null
          player_id: string | null
          power_level: number | null
          rack: number
          shot_number: number
          shot_type: Database["public"]["Enums"]["shot_type"] | null
          spin: Database["public"]["Enums"]["spin_type"] | null
          strategic_intent:
            | Database["public"]["Enums"]["strategic_intent"]
            | null
          table_position: Database["public"]["Enums"]["table_position"] | null
          updated_at: string
        }
        Insert: {
          ball_number?: number | null
          balls_pocketed_on_break?: number | null
          break_spread_quality?: number | null
          confidence_rating?: number | null
          created_at?: string
          cue_ball_control?:
            | Database["public"]["Enums"]["cue_ball_control"]
            | null
          cut_angle?: Database["public"]["Enums"]["cut_angle"] | null
          distance?: Database["public"]["Enums"]["distance"] | null
          error_type?: Database["public"]["Enums"]["error_type"] | null
          game_id: string
          id?: string
          is_break_shot?: boolean | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["shot_outcome"] | null
          player_id?: string | null
          power_level?: number | null
          rack: number
          shot_number: number
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          spin?: Database["public"]["Enums"]["spin_type"] | null
          strategic_intent?:
            | Database["public"]["Enums"]["strategic_intent"]
            | null
          table_position?: Database["public"]["Enums"]["table_position"] | null
          updated_at?: string
        }
        Update: {
          ball_number?: number | null
          balls_pocketed_on_break?: number | null
          break_spread_quality?: number | null
          confidence_rating?: number | null
          created_at?: string
          cue_ball_control?:
            | Database["public"]["Enums"]["cue_ball_control"]
            | null
          cut_angle?: Database["public"]["Enums"]["cut_angle"] | null
          distance?: Database["public"]["Enums"]["distance"] | null
          error_type?: Database["public"]["Enums"]["error_type"] | null
          game_id?: string
          id?: string
          is_break_shot?: boolean | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["shot_outcome"] | null
          player_id?: string | null
          power_level?: number | null
          rack?: number
          shot_number?: number
          shot_type?: Database["public"]["Enums"]["shot_type"] | null
          spin?: Database["public"]["Enums"]["spin_type"] | null
          strategic_intent?:
            | Database["public"]["Enums"]["strategic_intent"]
            | null
          table_position?: Database["public"]["Enums"]["table_position"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
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
      cue_ball_control: "on_target" | "safe_zone" | "out_of_line"
      cut_angle: "8/8" | "7/8" | "6/8" | "5/8" | "4/8" | "3/8" | "2/8" | "1/8"
      distance: "short" | "long"
      error_type: "none" | "aim" | "power" | "spin_deflection" | "mental"
      game_type: "8-ball" | "9-ball" | "10-ball" | "free-training"
      player_mode: "single" | "double"
      shot_outcome: "pocketed" | "safety" | "fail" | "miss" | "scratch"
      shot_type: "attack" | "defense"
      spin_type: "none" | "top" | "bottom" | "left" | "right"
      strategic_intent: "positioning" | "safety" | "breakout" | "straight_shot"
      table_position: "open" | "rail" | "bank"
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
      cue_ball_control: ["on_target", "safe_zone", "out_of_line"],
      cut_angle: ["8/8", "7/8", "6/8", "5/8", "4/8", "3/8", "2/8", "1/8"],
      distance: ["short", "long"],
      error_type: ["none", "aim", "power", "spin_deflection", "mental"],
      game_type: ["8-ball", "9-ball", "10-ball", "free-training"],
      player_mode: ["single", "double"],
      shot_outcome: ["pocketed", "safety", "fail", "miss", "scratch"],
      shot_type: ["attack", "defense"],
      spin_type: ["none", "top", "bottom", "left", "right"],
      strategic_intent: ["positioning", "safety", "breakout", "straight_shot"],
      table_position: ["open", "rail", "bank"],
    },
  },
} as const
