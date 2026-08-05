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
      app_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json
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
          last_measurement_at: string | null
          last_ping: string | null
          last_weight: number | null
        }
        Insert: {
          assigned_courier_id?: string | null
          id: string
          is_online?: boolean | null
          last_measurement_at?: string | null
          last_ping?: string | null
          last_weight?: number | null
        }
        Update: {
          assigned_courier_id?: string | null
          id?: string
          is_online?: boolean | null
          last_measurement_at?: string | null
          last_ping?: string | null
          last_weight?: number | null
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
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          id: string
          name: string
          onboarding_completed_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id: string
          name: string
          onboarding_completed_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          onboarding_completed_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string | null
          cut_off_time: string
          day_of_week: number | null
          id: number
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          cut_off_time: string
          day_of_week?: number | null
          id?: never
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          cut_off_time?: string
          day_of_week?: number | null
          id?: never
          is_active?: boolean | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          address_id: string | null
          ai_estimated_price: number | null
          ai_image_url: string | null
          ai_predicted_category: string | null
          client_id: string
          courier_id: string | null
          created_at: string | null
          id: string
          pickup_date: string | null
          route_sequence: number | null
          schedule_id: number | null
          short_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string | null
        }
        Insert: {
          address_id?: string | null
          ai_estimated_price?: number | null
          ai_image_url?: string | null
          ai_predicted_category?: string | null
          client_id: string
          courier_id?: string | null
          created_at?: string | null
          id?: string
          pickup_date?: string | null
          route_sequence?: number | null
          schedule_id?: number | null
          short_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string | null
        }
        Update: {
          address_id?: string | null
          ai_estimated_price?: number | null
          ai_image_url?: string | null
          ai_predicted_category?: string | null
          client_id?: string
          courier_id?: string | null
          created_at?: string | null
          id?: string
          pickup_date?: string | null
          route_sequence?: number | null
          schedule_id?: number | null
          short_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "user_addresses"
            referencedColumns: ["id"]
          },
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
      user_addresses: {
        Row: {
          city: string | null
          created_at: string | null
          district: string | null
          full_address: string
          id: string
          is_primary: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          phone_number: string | null
          profile_id: string
          province: string | null
          recipient_name: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          full_address: string
          id?: string
          is_primary?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          profile_id: string
          province?: string | null
          recipient_name?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          full_address?: string
          id?: string
          is_primary?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone_number?: string | null
          profile_id?: string
          province?: string | null
          recipient_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_categories: {
        Row: {
          carbon_factor: number
          created_at: string | null
          id: number
          material_group: string
          name: string
          price_per_kg: number
          updated_at: string | null
        }
        Insert: {
          carbon_factor: number
          created_at?: string | null
          id?: never
          material_group: string
          name: string
          price_per_kg: number
          updated_at?: string | null
        }
        Update: {
          carbon_factor?: number
          created_at?: string | null
          id?: never
          material_group?: string
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
          approved_at: string | null
          bank_name: string
          beneficiary_name: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          fee_amount: number
          id: string
          net_amount: number
          provider_reference_no: string | null
          refunded_at: string | null
          request_key: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string | null
        }
        Insert: {
          account_number: string
          amount: number
          approved_at?: string | null
          bank_name: string
          beneficiary_name?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          fee_amount?: number
          id?: string
          net_amount: number
          provider_reference_no?: string | null
          refunded_at?: string | null
          request_key: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          amount?: number
          approved_at?: string | null
          bank_name?: string
          beneficiary_name?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          fee_amount?: number
          id?: string
          net_amount?: number
          provider_reference_no?: string | null
          refunded_at?: string | null
          request_key?: string
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
      assign_iot_device: {
        Args: { p_courier_id: string; p_device_id: string }
        Returns: undefined
      }
      get_admin_dashboard: { Args: { p_period?: string }; Returns: Json }
      get_admin_iot_fleet: { Args: never; Returns: Json }
      request_withdrawal: {
        Args: {
          p_account_number: string
          p_amount: number
          p_bank_name: string
          p_beneficiary_name: string
          p_client_id: string
          p_fee_amount: number
          p_request_key: string
        }
        Returns: {
          account_number: string
          amount: number
          approved_at: string | null
          bank_name: string
          beneficiary_name: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          fee_amount: number
          id: string
          net_amount: number
          provider_reference_no: string | null
          refunded_at: string | null
          request_key: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finalize_withdrawal: {
        Args: {
          p_failure_reason?: string
          p_status: Database["public"]["Enums"]["withdrawal_status"]
          p_withdrawal_id: string
        }
        Returns: {
          account_number: string
          amount: number
          approved_at: string | null
          bank_name: string
          beneficiary_name: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          fee_amount: number
          id: string
          net_amount: number
          provider_reference_no: string | null
          refunded_at: string | null
          request_key: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      message_role: "user" | "assistant"
      ticket_status:
        | "pending"
        | "scheduled"
        | "on_the_way"
        | "completed"
        | "cancelled"
      user_role: "nasabah" | "kurir" | "admin" | "super_admin"
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
      user_role: ["nasabah", "kurir", "admin", "super_admin"],
      withdrawal_status: ["pending", "processing", "success", "failed"],
    },
  },
} as const
