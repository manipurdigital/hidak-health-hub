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
      addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          created_at: string
          id: string
          is_default: boolean | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string
          postal_code: string
          state: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone: string
          postal_code: string
          state: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string
          postal_code?: string
          state?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      carts: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_performance"
            referencedColumns: ["medicine_id"]
          },
          {
            foreignKeyName: "carts_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      center_staff: {
        Row: {
          center_id: string
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "center_staff_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_centers"
            referencedColumns: ["id"]
          },
        ]
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
      courier_locations: {
        Row: {
          booking_id: string | null
          center_id: string | null
          center_type: string
          created_at: string
          heading: number | null
          id: string
          lat: number
          lng: number
          order_id: string | null
          recorded_at: string
          speed_mps: number | null
        }
        Insert: {
          booking_id?: string | null
          center_id?: string | null
          center_type: string
          created_at?: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          order_id?: string | null
          recorded_at?: string
          speed_mps?: number | null
        }
        Update: {
          booking_id?: string | null
          center_id?: string | null
          center_type?: string
          created_at?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          order_id?: string | null
          recorded_at?: string
          speed_mps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "lab_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_cache: {
        Row: {
          cache_key: string
          city: string | null
          created_at: string
          day_of_week: number
          expires_at: string
          hour_of_day: number
          id: string
          pincode: string | null
          recommendations: Json
        }
        Insert: {
          cache_key: string
          city?: string | null
          created_at?: string
          day_of_week: number
          expires_at?: string
          hour_of_day: number
          id?: string
          pincode?: string | null
          recommendations: Json
        }
        Update: {
          cache_key?: string
          city?: string | null
          created_at?: string
          day_of_week?: number
          expires_at?: string
          hour_of_day?: number
          id?: string
          pincode?: string | null
          recommendations?: Json
        }
        Relationships: []
      }
      diagnostic_centers: {
        Row: {
          address: string | null
          contact_phone: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          service_areas: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_phone: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          service_areas?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_phone?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          service_areas?: string[] | null
          updated_at?: string
        }
        Relationships: []
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
          assigned_at: string | null
          booking_date: string
          center_id: string | null
          center_payout_amount: number | null
          center_payout_rate: number | null
          collected_at: string | null
          collector_name: string | null
          created_at: string
          eta: string | null
          id: string
          last_distance_meters: number | null
          last_eta_mins: number | null
          patient_email: string | null
          patient_name: string
          patient_phone: string
          payment_status: string | null
          pickup_window_end: string | null
          pickup_window_start: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          reschedule_reason: string | null
          special_instructions: string | null
          status: string | null
          test_id: string
          time_slot: string
          total_amount: number
          tracking_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          booking_date: string
          center_id?: string | null
          center_payout_amount?: number | null
          center_payout_rate?: number | null
          collected_at?: string | null
          collector_name?: string | null
          created_at?: string
          eta?: string | null
          id?: string
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          patient_email?: string | null
          patient_name: string
          patient_phone: string
          payment_status?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reschedule_reason?: string | null
          special_instructions?: string | null
          status?: string | null
          test_id: string
          time_slot: string
          total_amount: number
          tracking_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          booking_date?: string
          center_id?: string | null
          center_payout_amount?: number | null
          center_payout_rate?: number | null
          collected_at?: string | null
          collector_name?: string | null
          created_at?: string
          eta?: string | null
          id?: string
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string
          payment_status?: string | null
          pickup_window_end?: string | null
          pickup_window_start?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          reschedule_reason?: string | null
          special_instructions?: string | null
          status?: string | null
          test_id?: string
          time_slot?: string
          total_amount?: number
          tracking_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_bookings_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_centers"
            referencedColumns: ["id"]
          },
        ]
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
      notification_preferences: {
        Row: {
          booking_assigned_email: boolean
          booking_assigned_sms: boolean
          booking_created_email: boolean
          booking_created_sms: boolean
          created_at: string
          email_notifications: boolean
          id: string
          reschedule_requests_email: boolean
          reschedule_requests_sms: boolean
          sms_notifications: boolean
          status_updates_email: boolean
          status_updates_sms: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_assigned_email?: boolean
          booking_assigned_sms?: boolean
          booking_created_email?: boolean
          booking_created_sms?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          reschedule_requests_email?: boolean
          reschedule_requests_sms?: boolean
          sms_notifications?: boolean
          status_updates_email?: boolean
          status_updates_sms?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_assigned_email?: boolean
          booking_assigned_sms?: boolean
          booking_created_email?: boolean
          booking_created_sms?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          reschedule_requests_email?: boolean
          reschedule_requests_sms?: boolean
          sms_notifications?: boolean
          status_updates_email?: boolean
          status_updates_sms?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "medicine_performance"
            referencedColumns: ["medicine_id"]
          },
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
          courier_user_id: string | null
          created_at: string
          delivered_at: string | null
          delivery_center_id: string | null
          id: string
          last_distance_meters: number | null
          last_eta_mins: number | null
          notes: string | null
          order_number: string
          out_for_delivery_at: string | null
          packed_at: string | null
          payment_method: string | null
          payment_status: string | null
          prescription_required: boolean | null
          prescription_url: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping_address: Json
          status: string | null
          store_id: string | null
          stripe_session_id: string | null
          total_amount: number
          tracking_status: string | null
          tracking_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          courier_user_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_center_id?: string | null
          id?: string
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          notes?: string | null
          order_number: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          prescription_required?: boolean | null
          prescription_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address: Json
          status?: string | null
          store_id?: string | null
          stripe_session_id?: string | null
          total_amount: number
          tracking_status?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          courier_user_id?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_center_id?: string | null
          id?: string
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          notes?: string | null
          order_number?: string
          out_for_delivery_at?: string | null
          packed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          prescription_required?: boolean | null
          prescription_url?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address?: Json
          status?: string | null
          store_id?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          tracking_status?: string | null
          tracking_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      stores: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
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
      daily_analytics: {
        Row: {
          avg_order_value: number | null
          cod_orders: number | null
          cod_revenue: number | null
          date: string | null
          prepaid_orders: number | null
          prepaid_revenue: number | null
          total_orders: number | null
          total_revenue: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      medicine_performance: {
        Row: {
          avg_unit_price: number | null
          category_id: string | null
          last_ordered: string | null
          medicine_id: string | null
          medicine_name: string | null
          order_count: number | null
          total_quantity: number | null
          total_revenue: number | null
          unique_customers: number | null
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
      user_analytics: {
        Row: {
          date: string | null
          new_users: number | null
          users_with_orders: number | null
          users_with_subscriptions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_kpi_overview: {
        Args: { end_date: string; start_date: string }
        Returns: {
          active_subscriptions: number
          avg_order_value: number
          conversion_rate: number
          new_users: number
          order_growth: number
          prev_aov: number
          prev_new_users: number
          prev_orders: number
          prev_revenue: number
          revenue_growth: number
          total_orders: number
          total_revenue: number
        }[]
      }
      admin_timeseries_data: {
        Args: { end_date: string; metric_type: string; start_date: string }
        Returns: {
          date: string
          value: number
        }[]
      }
      admin_top_medicines: {
        Args: { end_date: string; limit_count?: number; start_date: string }
        Returns: {
          medicine_name: string
          order_count: number
          total_quantity: number
          total_revenue: number
          unique_customers: number
        }[]
      }
      can_book_consultation: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_courier_locations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      consultation_kpis: {
        Args: { end_date: string; start_date: string }
        Returns: {
          care_plus_consultations: number
          care_plus_share: number
          completed_consultations: number
          completion_rate: number
          consultation_revenue: number
          total_consultations: number
        }[]
      }
      consultations_by_day: {
        Args: { end_date: string; start_date: string }
        Returns: {
          completed: number
          consultation_date: string
          consultations: number
          revenue: number
        }[]
      }
      consultations_by_doctor: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avg_fee: number
          completed: number
          consultations: number
          doctor_name: string
          revenue: number
          specialization: string
        }[]
      }
      consultations_by_specialty: {
        Args: { end_date: string; start_date: string }
        Returns: {
          avg_fee: number
          completed: number
          consultations: number
          revenue: number
          specialization: string
        }[]
      }
      create_booking_notification: {
        Args: {
          booking_id: string
          event_type: string
          message: string
          title: string
        }
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_prescription_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_tracking_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_cached_recommendations: {
        Args: {
          at_ts: string
          in_city?: string
          in_pincode?: string
          top_n?: number
        }
        Returns: Json
      }
      get_lab_booking_by_token: {
        Args: { booking_id: string; token: string }
        Returns: {
          booking_date: string
          id: string
          last_distance_meters: number
          last_eta_mins: number
          patient_name: string
          status: string
          test_name: string
          time_slot: string
        }[]
      }
      get_latest_courier_location: {
        Args: { job_id: string; job_type: string }
        Returns: {
          heading: number
          lat: number
          lng: number
          recorded_at: string
          speed_mps: number
        }[]
      }
      get_order_by_token: {
        Args: { order_id: string; token: string }
        Returns: {
          id: string
          last_distance_meters: number
          last_eta_mins: number
          order_number: string
          status: string
          total_amount: number
        }[]
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
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_active_subscription: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_admin_access: {
        Args: { _user_id?: string }
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
      kpi_overview: {
        Args: { end_ts: string; start_ts: string }
        Returns: {
          active_subscriptions: number
          avg_order_value: number
          conversion_rate: number
          new_users: number
          prev_active_subs: number
          prev_aov: number
          prev_conversion_rate: number
          prev_new_users: number
          prev_orders: number
          prev_refund_rate: number
          prev_revenue: number
          refund_rate: number
          total_orders: number
          total_revenue: number
        }[]
      }
      lab_collections_by_center: {
        Args: {
          center_filter?: string
          city_filter?: string
          end_date: string
          pincode_filter?: string
          start_date: string
          test_filter?: string
        }
        Returns: {
          bookings: number
          center_name: string
          collected: number
          payouts: number
          revenue: number
        }[]
      }
      lab_collections_by_day: {
        Args: {
          center_filter?: string
          city_filter?: string
          end_date: string
          pincode_filter?: string
          start_date: string
          test_filter?: string
        }
        Returns: {
          bookings: number
          collected: number
          collection_date: string
          payouts: number
          revenue: number
        }[]
      }
      lab_collections_kpis: {
        Args: {
          center_filter?: string
          city_filter?: string
          end_date: string
          pincode_filter?: string
          start_date: string
          test_filter?: string
        }
        Returns: {
          center_payouts: number
          collected_bookings: number
          collection_rate: number
          lab_revenue: number
          total_bookings: number
        }[]
      }
      medicine_sales_by_day: {
        Args: { end_date: string; start_date: string }
        Returns: {
          aov: number
          orders: number
          revenue: number
          sale_date: string
        }[]
      }
      medicine_sales_by_store: {
        Args: { end_date: string; start_date: string }
        Returns: {
          aov: number
          orders: number
          revenue: number
          store_name: string
          top_medicine: string
        }[]
      }
      medicine_sales_kpis: {
        Args: { end_date: string; start_date: string }
        Returns: {
          aov: number
          cod_gmv: number
          cod_orders: number
          gmv: number
          prepaid_gmv: number
          prepaid_orders: number
          total_orders: number
        }[]
      }
      recommend_medicines_for_time: {
        Args: {
          at_ts: string
          in_city?: string
          in_pincode?: string
          top_n?: number
        }
        Returns: {
          expected_qty: number
          image_url: string
          medicine_id: string
          name: string
          price: number
          score: number
        }[]
      }
      refresh_analytics_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      revenue_breakdown: {
        Args: { breakdown_by: string; end_ts: string; start_ts: string }
        Returns: {
          category: string
          orders: number
          revenue: number
        }[]
      }
      set_cached_recommendations: {
        Args: {
          at_ts: string
          in_city?: string
          in_pincode?: string
          recommendations_data?: Json
          top_n?: number
        }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      timeseries_metric: {
        Args: {
          end_ts: string
          granularity: string
          metric_name: string
          start_ts: string
        }
        Returns: {
          time_bucket: string
          value: number
        }[]
      }
      top_medicines_by_revenue: {
        Args: { end_ts: string; limit_count?: number; start_ts: string }
        Returns: {
          medicine_name: string
          order_count: number
          total_quantity: number
          total_revenue: number
        }[]
      }
      top_medicines_by_revenue_detailed: {
        Args: { end_date: string; limit_count?: number; start_date: string }
        Returns: {
          avg_price: number
          medicine_name: string
          orders_count: number
          total_revenue: number
          units_sold: number
        }[]
      }
      trigger_cache_warming: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      universal_search: {
        Args: { max_per_group?: number; q: string }
        Returns: {
          href: string
          id: string
          price: number
          subtitle: string
          thumbnail_url: string
          title: string
          type: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "user"
        | "doctor"
        | "admin"
        | "lab"
        | "analyst"
        | "center"
        | "center_staff"
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
      app_role: [
        "user",
        "doctor",
        "admin",
        "lab",
        "analyst",
        "center",
        "center_staff",
      ],
    },
  },
} as const
