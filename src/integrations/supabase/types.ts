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
      geofences: {
        Row: {
          area_km2: number | null
          capacity_per_day: number | null
          center_id: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          min_order_value: number | null
          name: string
          notes: string | null
          polygon_coordinates: Json
          priority: number | null
          radius_meters: number | null
          service_type: string
          shape_type: string | null
          store_id: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          area_km2?: number | null
          capacity_per_day?: number | null
          center_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          name: string
          notes?: string | null
          polygon_coordinates: Json
          priority?: number | null
          radius_meters?: number | null
          service_type: string
          shape_type?: string | null
          store_id?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          area_km2?: number | null
          capacity_per_day?: number | null
          center_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          min_order_value?: number | null
          name?: string
          notes?: string | null
          polygon_coordinates?: Json
          priority?: number | null
          radius_meters?: number | null
          service_type?: string
          shape_type?: string | null
          store_id?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "geofences_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_items: {
        Row: {
          created_at: string | null
          created_medicine_id: string | null
          error: string | null
          id: string
          job_id: string | null
          payload: Json | null
          source_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_medicine_id?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_medicine_id?: string | null
          error?: string | null
          id?: string
          job_id?: string | null
          payload?: Json | null
          source_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_job_items_created_medicine_id_fkey"
            columns: ["created_medicine_id"]
            isOneToOne: false
            referencedRelation: "medicine_performance"
            referencedColumns: ["medicine_id"]
          },
          {
            foreignKeyName: "import_job_items_created_medicine_id_fkey"
            columns: ["created_medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          kind: string | null
          status: string | null
          summary: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string | null
          status?: string | null
          summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          kind?: string | null
          status?: string | null
          summary?: Json | null
          updated_at?: string | null
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
          brand_synonyms: string[] | null
          category_id: string | null
          composition_family_key: string | null
          composition_key: string | null
          composition_text: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          dosage: string | null
          expiry_date: string | null
          external_source_domain: string | null
          external_source_url: string | null
          fast_delivery: boolean | null
          form: string | null
          generic_name: string | null
          id: string
          image_hash: string | null
          image_url: string | null
          is_active: boolean | null
          manufacturer: string | null
          name: string
          original_image_url: string | null
          original_price: number | null
          pack_size: string | null
          price: number
          rating: number | null
          requires_prescription: boolean | null
          review_count: number | null
          source_attribution: string | null
          source_checksum: string | null
          source_last_fetched: string | null
          stock_quantity: number | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          brand_synonyms?: string[] | null
          category_id?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          composition_text?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          dosage?: string | null
          expiry_date?: string | null
          external_source_domain?: string | null
          external_source_url?: string | null
          fast_delivery?: boolean | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name: string
          original_image_url?: string | null
          original_price?: number | null
          pack_size?: string | null
          price: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          source_attribution?: string | null
          source_checksum?: string | null
          source_last_fetched?: string | null
          stock_quantity?: number | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          brand_synonyms?: string[] | null
          category_id?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          composition_text?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          dosage?: string | null
          expiry_date?: string | null
          external_source_domain?: string | null
          external_source_url?: string | null
          fast_delivery?: boolean | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name?: string
          original_image_url?: string | null
          original_price?: number | null
          pack_size?: string | null
          price?: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          source_attribution?: string | null
          source_checksum?: string | null
          source_last_fetched?: string | null
          stock_quantity?: number | null
          thumbnail_url?: string | null
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
      service_areas: {
        Row: {
          active: boolean | null
          capacity_per_day: number | null
          center_id: string
          center_type: string
          color: string | null
          created_at: string | null
          geom: unknown | null
          id: string
          name: string
          priority: number | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          active?: boolean | null
          capacity_per_day?: number | null
          center_id: string
          center_type: string
          color?: string | null
          created_at?: string | null
          geom?: unknown | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          active?: boolean | null
          capacity_per_day?: number | null
          center_id?: string
          center_type?: string
          color?: string | null
          created_at?: string | null
          geom?: unknown | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
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
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
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
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
          | {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
        Returns: string
      }
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
      apply_rls_fixes: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      audit_rls: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_default_deny: boolean
          issues: string[]
          permissive_policies: number
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_polygon_area: {
        Args: { coordinates: Json }
        Returns: number
      }
      can_book_consultation: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      check_enhanced_serviceability: {
        Args: {
          lat: number
          lng: number
          order_value?: number
          service_type: string
        }
        Returns: {
          center_id: string
          color: string
          geofence_id: string
          is_serviceable: boolean
          min_order_value: number
          name: string
          priority: number
          reason: string
          store_id: string
        }[]
      }
      check_point_serviceability: {
        Args: { lat: number; lng: number; service_type: string }
        Returns: {
          center_id: string
          geofence_id: string
          name: string
          priority: number
          store_id: string
        }[]
      }
      check_point_serviceability_new: {
        Args: { lat: number; lng: number; service_center_type: string }
        Returns: {
          capacity_per_day: number
          center_id: string
          name: string
          priority: number
          service_area_id: string
        }[]
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_courier_locations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      composition_family_key_from_text: {
        Args: { txt: string }
        Returns: string
      }
      composition_key_from_text: {
        Args: { txt: string }
        Returns: string
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
      create_service_area_with_geom: {
        Args: { area_data: Json; geom_sql: string }
        Returns: string
      }
      detect_salt_composition: {
        Args: { text_input: string }
        Returns: boolean
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
          | { column_name: string; schema_name: string; table_name: string }
          | { column_name: string; table_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      generate_composition_family_key: {
        Args: { composition: string }
        Returns: string
      }
      generate_composition_key: {
        Args: { composition: string }
        Returns: string
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
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_available_centers_for_location: {
        Args: { lat: number; lng: number; service_type: string }
        Returns: {
          center_id: string
          center_name: string
          geofence_name: string
          priority: number
          store_id: string
          store_name: string
        }[]
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
      get_daily_job_count: {
        Args: {
          center_id_param: string
          center_type_param: string
          check_date?: string
        }
        Returns: number
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
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_service_area_info: {
        Args: { in_lat: number; in_lng: number; in_type: string }
        Returns: {
          area_id: string
          area_name: string
          capacity_per_day: number
          center_id: string
          color: string
          distance_m: number
          priority: number
          working_hours: Json
        }[]
      }
      get_user_center_access: {
        Args: { user_id_param: string }
        Returns: {
          center_id: string
          role: string
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
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
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
      is_location_serviceable: {
        Args: { in_lat: number; in_lng: number; in_type: string }
        Returns: boolean
      }
      is_within_working_hours: {
        Args: { check_time?: string; working_hours: Json }
        Returns: boolean
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
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
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      normalize_composition: {
        Args: { composition: string }
        Returns: string
      }
      normalize_token: {
        Args: { s: string }
        Returns: string
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pick_center_for_job: {
        Args: { in_lat: number; in_lng: number; in_type: string }
        Returns: {
          center_id: string
          reason: string
        }[]
      }
      pick_center_with_load_balancing: {
        Args: { in_lat: number; in_lng: number; in_type: string }
        Returns: {
          center_id: string
          current_load: number
          reason: string
        }[]
      }
      pick_center_with_validation: {
        Args: {
          allow_closed?: boolean
          check_time?: string
          in_lat: number
          in_lng: number
          in_type: string
        }
        Returns: {
          center_id: string
          current_load: number
          is_open: boolean
          reason: string
          warnings: string[]
        }[]
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      search_medicines_brand_or_composition: {
        Args: { max_rows?: number; q: string }
        Returns: {
          composition_family_key: string
          composition_key: string
          composition_text: string
          generic_name: string
          id: string
          name: string
          price: number
          rank_score: number
          thumbnail_url: string
        }[]
      }
      serviceable_centers: {
        Args: { in_lat: number; in_lng: number; in_type: string }
        Returns: {
          area_id: string
          center_id: string
          center_type: string
          distance_m: number
          priority: number
        }[]
      }
      serviceable_centers_with_validation: {
        Args: {
          check_time?: string
          in_lat: number
          in_lng: number
          in_type: string
        }
        Returns: {
          area_id: string
          capacity_available: boolean
          center_id: string
          center_type: string
          current_load: number
          distance_m: number
          is_open: boolean
          priority: number
          rejection_reason: string
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
      similar_medicines: {
        Args: { mode?: string; ref_medicine_id: string }
        Returns: {
          id: string
          name: string
          price: number
          thumbnail_url: string
        }[]
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
          | {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { format?: string; geom: unknown }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; rel?: number }
          | { geom: unknown; maxdecimaldigits?: number; rel?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; options?: string; radius: number }
          | { geom: unknown; quadsegs: number; radius: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { dm?: number; dx: number; dy: number; dz?: number; geom: unknown }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { font?: Json; letters: string }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { from_proj: string; geom: unknown; to_proj: string }
          | { from_proj: string; geom: unknown; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      test_point_serviceability: {
        Args: { lat: number; lng: number; service_center_type: string }
        Returns: {
          capacity_per_day: number
          center_id: string
          is_within: boolean
          name: string
          priority: number
          service_area_id: string
        }[]
      }
      text: {
        Args: { "": unknown }
        Returns: string
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
          group_key: string
          href: string
          id: string
          price: number
          subtitle: string
          thumbnail_url: string
          title: string
          type: string
        }[]
      }
      universal_search_v2: {
        Args: { max_per_group?: number; q: string }
        Returns: {
          group_key: string
          href: string
          id: string
          price: number
          subtitle: string
          thumbnail_url: string
          title: string
          type: string
        }[]
      }
      universal_search_with_alternatives: {
        Args: { max_per_group?: number; q: string }
        Returns: {
          composition_match_type: string
          href: string
          id: string
          is_alternative: boolean
          price: number
          subtitle: string
          thumbnail_url: string
          title: string
          type: string
        }[]
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_service_area_geom: {
        Args: { area_data: Json; area_id: string; new_geom: string }
        Returns: string
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      validate_polygon_vertices: {
        Args: { polygon_coords: Json }
        Returns: boolean
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
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
