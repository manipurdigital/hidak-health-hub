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
      audit_log: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      consultation_messages: {
        Row: {
          consultation_id: string
          content: string
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string
          sender_type: string
          sent_at: string
        }
        Insert: {
          consultation_id: string
          content: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id: string
          sender_type: string
          sent_at?: string
        }
        Update: {
          consultation_id?: string
          content?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string
          sender_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consultation_messages_consultation"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consultation_date: string
          consultation_type: string | null
          created_at: string
          doctor_id: string
          doctor_notes: string | null
          id: string
          patient_id: string
          patient_notes: string | null
          payment_status: string | null
          status: string | null
          time_slot: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          consultation_date: string
          consultation_type?: string | null
          created_at?: string
          doctor_id: string
          doctor_notes?: string | null
          id?: string
          patient_id: string
          patient_notes?: string | null
          payment_status?: string | null
          status?: string | null
          time_slot: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          consultation_date?: string
          consultation_type?: string | null
          created_at?: string
          doctor_id?: string
          doctor_notes?: string | null
          id?: string
          patient_id?: string
          patient_notes?: string | null
          payment_status?: string | null
          status?: string | null
          time_slot?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consultations_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_doctor_availability_doctor"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          consultation_fee: number
          created_at: string
          experience_years: number | null
          full_name: string
          hospital_affiliation: string | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          license_number: string | null
          profile_image_url: string | null
          qualification: string | null
          rating: number | null
          review_count: number | null
          specialization: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          consultation_fee: number
          created_at?: string
          experience_years?: number | null
          full_name: string
          hospital_affiliation?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_image_url?: string | null
          qualification?: string | null
          rating?: number | null
          review_count?: number | null
          specialization: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          experience_years?: number | null
          full_name?: string
          hospital_affiliation?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          profile_image_url?: string | null
          qualification?: string | null
          rating?: number | null
          review_count?: number | null
          specialization?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_bookings: {
        Row: {
          booking_date: string
          created_at: string
          id: string
          patient_email: string | null
          patient_name: string
          patient_phone: string
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          special_instructions: string | null
          status: string | null
          test_id: string
          time_slot: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          special_instructions?: string | null
          status?: string | null
          test_id: string
          time_slot: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          id?: string
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          special_instructions?: string | null
          status?: string | null
          test_id?: string
          time_slot?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          booking_id: string | null
          file_size: number | null
          file_type: string | null
          id: string
          report_name: string
          report_url: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          report_name: string
          report_url: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          report_name?: string
          report_url?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lab_tests: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          preparation_required: boolean | null
          price: number
          reporting_time: string | null
          sample_type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          preparation_required?: boolean | null
          price: number
          reporting_time?: string | null
          sample_type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          preparation_required?: boolean | null
          price?: number
          reporting_time?: string | null
          sample_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      medicine_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          dosage: string | null
          expiry_date: string | null
          fast_delivery: boolean | null
          form: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          manufacturer: string | null
          name: string
          original_price: number | null
          pack_size: string | null
          price: number
          rating: number | null
          requires_prescription: boolean | null
          review_count: number | null
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          dosage?: string | null
          expiry_date?: string | null
          fast_delivery?: boolean | null
          form?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name: string
          original_price?: number | null
          pack_size?: string | null
          price: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          dosage?: string | null
          expiry_date?: string | null
          fast_delivery?: boolean | null
          form?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name?: string
          original_price?: number | null
          pack_size?: string | null
          price?: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "medicine_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          prescription_required: boolean | null
          prescription_url: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping_address: Json
          status: string | null
          stripe_session_id: string | null
          total_amount: number
          tracking_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          prescription_required?: boolean | null
          prescription_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address: Json
          status?: string | null
          stripe_session_id?: string | null
          total_amount: number
          tracking_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          prescription_required?: boolean | null
          prescription_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address?: Json
          status?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          tracking_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          consultation_id: string
          created_at: string
          diagnosis: string | null
          doctor_id: string
          follow_up_date: string | null
          id: string
          instructions: string | null
          medications: Json
          patient_id: string
          prescription_number: string
          status: string | null
          updated_at: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          follow_up_date?: string | null
          id?: string
          instructions?: string | null
          medications: Json
          patient_id: string
          prescription_number: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          follow_up_date?: string | null
          id?: string
          instructions?: string | null
          medications?: Json
          patient_id?: string
          prescription_number?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prescriptions_consultation"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          blood_group: string | null
          city: string | null
          created_at: string
          current_medications: string[] | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          id: string
          medical_allergies: string[] | null
          medical_conditions: string[] | null
          phone: string | null
          postal_code: string | null
          profile_picture_url: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_allergies?: string[] | null
          medical_conditions?: string[] | null
          phone?: string | null
          postal_code?: string | null
          profile_picture_url?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          current_medications?: string[] | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_allergies?: string[] | null
          medical_conditions?: string[] | null
          phone?: string | null
          postal_code?: string | null
          profile_picture_url?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string | null
          extra_discount_percentage: number | null
          features: Json
          free_delivery: boolean | null
          id: string
          is_active: boolean | null
          max_consultations: number | null
          plan_code: string
          plan_name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          extra_discount_percentage?: number | null
          features?: Json
          free_delivery?: boolean | null
          id?: string
          is_active?: boolean | null
          max_consultations?: number | null
          plan_code: string
          plan_name: string
          price: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          extra_discount_percentage?: number | null
          features?: Json
          free_delivery?: boolean | null
          id?: string
          is_active?: boolean | null
          max_consultations?: number | null
          plan_code?: string
          plan_name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_usage: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          month_year: string
          subscription_id: string
          used_count: number | null
        }
        Insert: {
          created_at?: string
          feature_type: string
          id?: string
          month_year: string
          subscription_id: string
          used_count?: number | null
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          month_year?: string
          subscription_id?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription_usage_subscription"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          consultations_used: number | null
          created_at: string
          current_period_end: string
          current_period_start: string
          customer_id: string | null
          id: string
          plan_id: string
          razorpay_payment_id: string | null
          status: string
          subscription_id: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consultations_used?: number | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          customer_id?: string | null
          id?: string
          plan_id: string
          razorpay_payment_id?: string | null
          status?: string
          subscription_id: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consultations_used?: number | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          customer_id?: string | null
          id?: string
          plan_id?: string
          razorpay_payment_id?: string | null
          status?: string
          subscription_id?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_subscriptions_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_book_consultation: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_prescription_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_subscription: {
        Args: { user_uuid: string }
        Returns: {
          consultations_used: number
          current_period_end: string
          extra_discount_percentage: number
          free_delivery: boolean
          max_consultations: number
          plan_code: string
          plan_name: string
          status: string
          subscription_id: string
        }[]
      }
      has_active_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "doctor" | "admin" | "lab"
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
      app_role: ["user", "doctor", "admin", "lab"],
    },
  },
} as const
