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
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_devices: {
        Row: {
          assigned_courier_id: string | null
          id: string
          is_online: boolean | null
          last_ping: string | null
        }
        Insert: {
          assigned_courier_id?: string | null
          id: string
          is_online?: boolean | null
          last_ping?: string | null
        }
        Update: {
          assigned_courier_id?: string | null
          id?: string
          is_online?: boolean | null
          last_ping?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_assigned_courier_id_fkey"
            columns: ["assigned_courier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          id: string
          name: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id: string
          name: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string | null
          cut_off_time: string
          id: number
          is_active: boolean | null
          operational_date: string
        }
        Insert: {
          created_at?: string | null
          cut_off_time: string
          id?: never
          is_active?: boolean | null
          operational_date: string
        }
        Update: {
          created_at?: string | null
          cut_off_time?: string
          id?: never
          is_active?: boolean | null
          operational_date?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          ai_estimated_price: number | null
          ai_image_url: string | null
          ai_predicted_category: string | null
          client_id: string
          courier_id: string | null
          created_at: string | null
          id: string
          route_sequence: number | null
          schedule_id: number | null
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string | null
        }
        Insert: {
          ai_estimated_price?: number | null
          ai_image_url?: string | null
          ai_predicted_category?: string | null
          client_id: string
          courier_id?: string | null
          created_at?: string | null
          id?: string
          route_sequence?: number | null
          schedule_id?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string | null
        }
        Update: {
          ai_estimated_price?: number | null
          ai_image_url?: string | null
          ai_predicted_category?: string | null
          client_id?: string
          courier_id?: string | null
          created_at?: string | null
          id?: string
          route_sequence?: number | null
          schedule_id?: number | null
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_details: {
        Row: {
          created_at: string | null
          id: number
          price_applied: number
          subtotal: number
          ticket_id: string
          waste_category_id: number
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: never
          price_applied: number
          subtotal: number
          ticket_id: string
          waste_category_id: number
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: never
          price_applied?: number
          subtotal?: number
          ticket_id?: string
          waste_category_id?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_details_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_details_waste_category_id_fkey"
            columns: ["waste_category_id"]
            isOneToOne: false
            referencedRelation: "waste_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_categories: {
        Row: {
          carbon_factor: number
          created_at: string | null
          id: number
          name: string
          price_per_kg: number
          updated_at: string | null
        }
        Insert: {
          carbon_factor: number
          created_at?: string | null
          id?: never
          name: string
          price_per_kg: number
          updated_at?: string | null
        }
        Update: {
          carbon_factor?: number
          created_at?: string | null
          id?: never
          name?: string
          price_per_kg?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_number: string
          amount: number
          bank_name: string
          client_id: string
          created_at: string | null
          id: string
          midtrans_status: string | null
          midtrans_transaction_id: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string | null
        }
        Insert: {
          account_number: string
          amount: number
          bank_name: string
          client_id: string
          created_at?: string | null
          id?: string
          midtrans_status?: string | null
          midtrans_transaction_id?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          amount?: number
          bank_name?: string
          client_id?: string
          created_at?: string | null
          id?: string
          midtrans_status?: string | null
          midtrans_transaction_id?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      message_role: "user" | "assistant"
      ticket_status:
        | "pending"
        | "scheduled"
        | "on_the_way"
        | "completed"
        | "cancelled"
      user_role: "nasabah" | "kurir" | "admin"
      withdrawal_status: "pending" | "processing" | "success" | "failed"
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
      message_role: ["user", "assistant"],
      ticket_status: [
        "pending",
        "scheduled",
        "on_the_way",
        "completed",
        "cancelled",
      ],
      user_role: ["nasabah", "kurir", "admin"],
      withdrawal_status: ["pending", "processing", "success", "failed"],
    },
  },
} as const

