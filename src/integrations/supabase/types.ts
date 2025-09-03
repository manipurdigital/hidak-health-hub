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
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          landmark: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string
          state: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code: string
          state: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string
          state?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          message: string | null
          processed_at: string | null
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          message?: string | null
          processed_at?: string | null
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string | null
          processed_at?: string | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      base_locations: {
        Row: {
          base_fare: number
          base_km: number
          base_lat: number
          base_lng: number
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          per_km_fee: number
          priority: number
          service_type: string
          updated_at: string
        }
        Insert: {
          base_fare?: number
          base_km?: number
          base_lat: number
          base_lng: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          per_km_fee?: number
          priority?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          base_fare?: number
          base_km?: number
          base_lat?: number
          base_lng?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          per_km_fee?: number
          priority?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      center_staff: {
        Row: {
          center_id: string
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role: string
          user_id: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
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
      centers: {
        Row: {
          address: string
          created_at: string | null
          email: string | null
          id: string
          is_available: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      consultation_messages: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          file_url: string | null
          id: string
          message: string
          message_type: string | null
          sender_id: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          message: string
          message_type?: string | null
          sender_id?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          message?: string
          message_type?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
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
          consultation_fee: number
          consultation_time: string
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          patient_id: string | null
          patient_notes: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          time_slot: string | null
          total_amount: number | null
        }
        Insert: {
          consultation_date: string
          consultation_fee: number
          consultation_time: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          patient_notes?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          time_slot?: string | null
          total_amount?: number | null
        }
        Update: {
          consultation_date?: string
          consultation_fee?: number
          consultation_time?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          patient_notes?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          time_slot?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_locations: {
        Row: {
          accuracy_meters: number | null
          created_at: string | null
          heading_degrees: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          rider_id: string | null
          speed_kmh: number | null
        }
        Insert: {
          accuracy_meters?: number | null
          created_at?: string | null
          heading_degrees?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          rider_id?: string | null
          speed_kmh?: number | null
        }
        Update: {
          accuracy_meters?: number | null
          created_at?: string | null
          heading_degrees?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          rider_id?: string | null
          speed_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_locations_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          assigned_at: string | null
          center_payout_amount: number | null
          created_at: string
          customer_address: Json | null
          delivered_at: string | null
          dest_lat: number | null
          dest_lng: number | null
          id: string
          notes: string | null
          order_id: string
          order_number: string | null
          picked_up_at: string | null
          rider_code: string | null
          rider_id: string | null
          rider_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          center_payout_amount?: number | null
          created_at?: string
          customer_address?: Json | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          id?: string
          notes?: string | null
          order_id: string
          order_number?: string | null
          picked_up_at?: string | null
          rider_code?: string | null
          rider_id?: string | null
          rider_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          center_payout_amount?: number | null
          created_at?: string
          customer_address?: Json | null
          delivered_at?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          order_number?: string | null
          picked_up_at?: string | null
          rider_code?: string | null
          rider_id?: string | null
          rider_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_centers: {
        Row: {
          address: string
          created_at: string | null
          email: string | null
          id: string
          is_available: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_available?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      delivery_partners: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          license_number: string | null
          phone: string
          updated_at: string | null
          user_id: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          phone: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          phone?: string
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      diagnostic_centers: {
        Row: {
          address: string
          contact_phone: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          platform_commission_rate: number
          updated_at: string
        }
        Insert: {
          address: string
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          platform_commission_rate?: number
          updated_at?: string
        }
        Update: {
          address?: string
          contact_phone?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          platform_commission_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          availability_date: string
          created_at: string | null
          doctor_id: string | null
          end_time: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          availability_date?: string
          created_at?: string | null
          doctor_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          availability_date?: string
          created_at?: string | null
          doctor_id?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
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
          consultation_fee: number | null
          contact_email: string | null
          created_at: string | null
          experience_years: number | null
          full_name: string | null
          hospital_affiliation: string | null
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          name: string
          profile_image_url: string | null
          qualification: string | null
          rating: number | null
          review_count: number | null
          specialization: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          contact_email?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          hospital_affiliation?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name: string
          profile_image_url?: string | null
          qualification?: string | null
          rating?: number | null
          review_count?: number | null
          specialization: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          contact_email?: string | null
          created_at?: string | null
          experience_years?: number | null
          full_name?: string | null
          hospital_affiliation?: string | null
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name?: string
          profile_image_url?: string | null
          qualification?: string | null
          rating?: number | null
          review_count?: number | null
          specialization?: string
          user_id?: string | null
        }
        Relationships: []
      }
      geofences: {
        Row: {
          center_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          polygon: Json
          priority: number
          service_type: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          polygon: Json
          priority?: number
          service_type: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          polygon?: Json
          priority?: number
          service_type?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_items: {
        Row: {
          created_at: string
          created_medicine_id: string | null
          error: string | null
          id: string
          job_id: string
          payload: Json | null
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_medicine_id?: string | null
          error?: string | null
          id?: string
          job_id: string
          payload?: Json | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_medicine_id?: string | null
          error?: string | null
          id?: string
          job_id?: string
          payload?: Json | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
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
          created_at: string
          created_by: string | null
          id: string
          kind: string
          status: string
          summary: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          status?: string
          summary?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_bookings: {
        Row: {
          assignment_notes: string | null
          booking_date: string
          booking_time: string | null
          center_payout_amount: number | null
          created_at: string | null
          geofence_validated_at: string | null
          id: string
          is_within_service_area: boolean | null
          last_distance_meters: number | null
          last_eta_mins: number | null
          notes: string | null
          paid_at: string | null
          patient_name: string | null
          patient_phone: string | null
          payment_status: string | null
          pickup_address: Json | null
          pickup_lat: number | null
          pickup_lng: number | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
          test_id: string | null
          total_amount: number
          tracking_token: string | null
          user_id: string | null
        }
        Insert: {
          assignment_notes?: string | null
          booking_date: string
          booking_time?: string | null
          center_payout_amount?: number | null
          created_at?: string | null
          geofence_validated_at?: string | null
          id?: string
          is_within_service_area?: boolean | null
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          notes?: string | null
          paid_at?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string | null
          pickup_address?: Json | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          test_id?: string | null
          total_amount: number
          tracking_token?: string | null
          user_id?: string | null
        }
        Update: {
          assignment_notes?: string | null
          booking_date?: string
          booking_time?: string | null
          center_payout_amount?: number | null
          created_at?: string | null
          geofence_validated_at?: string | null
          id?: string
          is_within_service_area?: boolean | null
          last_distance_meters?: number | null
          last_eta_mins?: number | null
          notes?: string | null
          paid_at?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_status?: string | null
          pickup_address?: Json | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
          test_id?: string | null
          total_amount?: number
          tracking_token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_bookings_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "lab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_reports: {
        Row: {
          booking_id: string | null
          created_at: string | null
          file_size: number | null
          file_type: string | null
          id: string
          report_data: Json | null
          report_name: string | null
          report_url: string | null
          status: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          report_data?: Json | null
          report_name?: string | null
          report_url?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          report_data?: Json | null
          report_name?: string | null
          report_url?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "lab_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_tests: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          name: string
          normal_range: string | null
          preparation_instructions: string | null
          preparation_required: boolean | null
          price: number
          reporting_time: string | null
          sample_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name: string
          normal_range?: string | null
          preparation_instructions?: string | null
          preparation_required?: boolean | null
          price: number
          reporting_time?: string | null
          sample_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          name?: string
          normal_range?: string | null
          preparation_instructions?: string | null
          preparation_required?: boolean | null
          price?: number
          reporting_time?: string | null
          sample_type?: string | null
        }
        Relationships: []
      }
      medicine_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          action_class: string | null
          alternative_brands: Json | null
          brand: string | null
          category_id: string | null
          chemical_class: string | null
          composition: string | null
          composition_family_key: string | null
          composition_key: string | null
          country_of_origin: string | null
          created_at: string | null
          dedupe_key: string | null
          description: string | null
          discount_percent: number | null
          discount_percentage: number | null
          discount_price: number | null
          dosage_form: string | null
          dosage_strength: string | null
          expiry_date: string | null
          external_source_domain: string | null
          external_source_url: string | null
          facts: string | null
          faq: Json | null
          fast_delivery: boolean | null
          generic_name: string | null
          habit_forming: boolean | null
          how_it_works: string | null
          how_to_use: string | null
          id: string
          image_hash: string | null
          image_url: string | null
          interaction_warnings: Json | null
          is_active: boolean | null
          is_available: boolean | null
          key_highlights: Json | null
          manufacturer: string | null
          marketed_by: string | null
          min_stock_level: number | null
          mrp: number | null
          name: string
          original_image_url: string | null
          original_price: number | null
          pack_size: string | null
          pack_size_unit: string | null
          prescription_required: boolean | null
          prescription_type: string | null
          price: number
          rating: number | null
          requires_prescription: boolean | null
          review_count: number | null
          route_of_administration: string | null
          safety_advice: string | null
          salt_composition: string | null
          side_effects: string | null
          source_attribution: string | null
          source_checksum: string | null
          source_last_fetched: string | null
          stock_quantity: number | null
          storage_conditions: string | null
          strength: string | null
          substitute_available: boolean | null
          therapeutic_class: string | null
          thumbnail_url: string | null
          updated_at: string | null
          uses: string | null
          what_if_you_forget: string | null
        }
        Insert: {
          action_class?: string | null
          alternative_brands?: Json | null
          brand?: string | null
          category_id?: string | null
          chemical_class?: string | null
          composition?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          description?: string | null
          discount_percent?: number | null
          discount_percentage?: number | null
          discount_price?: number | null
          dosage_form?: string | null
          dosage_strength?: string | null
          expiry_date?: string | null
          external_source_domain?: string | null
          external_source_url?: string | null
          facts?: string | null
          faq?: Json | null
          fast_delivery?: boolean | null
          generic_name?: string | null
          habit_forming?: boolean | null
          how_it_works?: string | null
          how_to_use?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          interaction_warnings?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          key_highlights?: Json | null
          manufacturer?: string | null
          marketed_by?: string | null
          min_stock_level?: number | null
          mrp?: number | null
          name: string
          original_image_url?: string | null
          original_price?: number | null
          pack_size?: string | null
          pack_size_unit?: string | null
          prescription_required?: boolean | null
          prescription_type?: string | null
          price: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          route_of_administration?: string | null
          safety_advice?: string | null
          salt_composition?: string | null
          side_effects?: string | null
          source_attribution?: string | null
          source_checksum?: string | null
          source_last_fetched?: string | null
          stock_quantity?: number | null
          storage_conditions?: string | null
          strength?: string | null
          substitute_available?: boolean | null
          therapeutic_class?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uses?: string | null
          what_if_you_forget?: string | null
        }
        Update: {
          action_class?: string | null
          alternative_brands?: Json | null
          brand?: string | null
          category_id?: string | null
          chemical_class?: string | null
          composition?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          description?: string | null
          discount_percent?: number | null
          discount_percentage?: number | null
          discount_price?: number | null
          dosage_form?: string | null
          dosage_strength?: string | null
          expiry_date?: string | null
          external_source_domain?: string | null
          external_source_url?: string | null
          facts?: string | null
          faq?: Json | null
          fast_delivery?: boolean | null
          generic_name?: string | null
          habit_forming?: boolean | null
          how_it_works?: string | null
          how_to_use?: string | null
          id?: string
          image_hash?: string | null
          image_url?: string | null
          interaction_warnings?: Json | null
          is_active?: boolean | null
          is_available?: boolean | null
          key_highlights?: Json | null
          manufacturer?: string | null
          marketed_by?: string | null
          min_stock_level?: number | null
          mrp?: number | null
          name?: string
          original_image_url?: string | null
          original_price?: number | null
          pack_size?: string | null
          pack_size_unit?: string | null
          prescription_required?: boolean | null
          prescription_type?: string | null
          price?: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          route_of_administration?: string | null
          safety_advice?: string | null
          salt_composition?: string | null
          side_effects?: string | null
          source_attribution?: string | null
          source_checksum?: string | null
          source_last_fetched?: string | null
          stock_quantity?: number | null
          storage_conditions?: string | null
          strength?: string | null
          substitute_available?: boolean | null
          therapeutic_class?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uses?: string | null
          what_if_you_forget?: string | null
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
          consultation_reminders: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          payment_reminders: boolean | null
          prescription_reminders: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          consultation_reminders?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          payment_reminders?: boolean | null
          prescription_reminders?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          consultation_reminders?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          payment_reminders?: boolean | null
          prescription_reminders?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string
          name: string
          title_template: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          name: string
          title_template: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          name?: string
          title_template?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          medicine_id: string | null
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          order_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          order_id?: string | null
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
          assignment_notes: string | null
          center_id: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_center_id: string | null
          delivery_phone: string | null
          dest_lat: number | null
          dest_lng: number | null
          geofence_validated_at: string | null
          id: string
          is_within_service_area: boolean | null
          notes: string | null
          order_number: string
          paid_at: string | null
          patient_location_lat: number | null
          patient_location_lng: number | null
          patient_name: string | null
          patient_phone: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assignment_notes?: string | null
          center_id?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_center_id?: string | null
          delivery_phone?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          geofence_validated_at?: string | null
          id?: string
          is_within_service_area?: boolean | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          patient_location_lat?: number | null
          patient_location_lng?: number | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assignment_notes?: string | null
          center_id?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_center_id?: string | null
          delivery_phone?: string | null
          dest_lat?: number | null
          dest_lng?: number | null
          geofence_validated_at?: string | null
          id?: string
          is_within_service_area?: boolean | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          patient_location_lat?: number | null
          patient_location_lng?: number | null
          patient_name?: string | null
          patient_phone?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_center_id_fkey"
            columns: ["delivery_center_id"]
            isOneToOne: false
            referencedRelation: "delivery_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          correlation_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          signature_valid: boolean | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          id: string
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          metadata: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          metadata?: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          metadata?: Json | null
          method?: string
          response_time_ms?: number
          status_code?: number
          user_id?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          patient_id: string | null
          prescription_data: Json
          prescription_number: string | null
          status: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          prescription_data: Json
          prescription_number?: string | null
          status?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          patient_id?: string | null
          prescription_data?: Json
          prescription_number?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      query_cache: {
        Row: {
          cache_key: string
          cache_value: Json
          created_at: string | null
          expires_at: string
          id: string
        }
        Insert: {
          cache_key: string
          cache_value: Json
          created_at?: string | null
          expires_at: string
          id?: string
        }
        Update: {
          cache_key?: string
          cache_value?: Json
          created_at?: string | null
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      riders: {
        Row: {
          code: string
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string | null
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
          address: string
          code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_cycle: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          extra_discount_percentage: number | null
          features: Json | null
          free_delivery: boolean | null
          id: string
          is_active: boolean | null
          max_consultations: number | null
          name: string
          plan_code: string
          plan_name: string | null
          price: number
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          duration_days: number
          extra_discount_percentage?: number | null
          features?: Json | null
          free_delivery?: boolean | null
          id?: string
          is_active?: boolean | null
          max_consultations?: number | null
          name: string
          plan_code: string
          plan_name?: string | null
          price: number
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          extra_discount_percentage?: number | null
          features?: Json | null
          free_delivery?: boolean | null
          id?: string
          is_active?: boolean | null
          max_consultations?: number | null
          name?: string
          plan_code?: string
          plan_name?: string | null
          price?: number
        }
        Relationships: []
      }
      subscription_usage: {
        Row: {
          created_at: string | null
          feature_type: string
          id: string
          month_year: string
          subscription_id: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          id?: string
          month_year: string
          subscription_id?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          id?: string
          month_year?: string
          subscription_id?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consents: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          end_date: string
          id: string
          payment_status: string | null
          plan_id: string | null
          start_date: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          end_date: string
          id?: string
          payment_status?: string | null
          plan_id?: string | null
          start_date: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          end_date?: string
          id?: string
          payment_status?: string | null
          plan_id?: string | null
          start_date?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      video_call_invitations: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          doctor_id: string | null
          expires_at: string
          id: string
          invitation_token: string
          patient_id: string | null
          status: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          expires_at: string
          id?: string
          invitation_token: string
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          patient_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_call_invitations_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_call_invitations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      video_calls: {
        Row: {
          channel_name: string
          consultation_id: string | null
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          token: string | null
        }
        Insert: {
          channel_name: string
          consultation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          token?: string | null
        }
        Update: {
          channel_name?: string
          consultation_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_calls_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
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
      admin_link_doctor_account: {
        Args: { p_doctor_id: string; p_email: string }
        Returns: undefined
      }
      admin_timeseries_data: {
        Args: { end_date: string; metric_type: string; start_date: string }
        Returns: {
          date: string
          value: number
        }[]
      }
      admin_top_medicines: {
        Args: { end_date: string; limit_count: number; start_date: string }
        Returns: {
          medicine_name: string
          order_count: number
          total_quantity: number
          total_revenue: number
          unique_customers: number
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
      calc_distance_fee_from_geofence: {
        Args: { p_dest_lat: number; p_dest_lng: number; p_service: string }
        Returns: {
          distance_km: number
          fee: number
          geofence_id: string
          geofence_name: string
        }[]
      }
      check_medicine_availability: {
        Args: { p_medicine_id: string; p_quantity: number }
        Returns: boolean
      }
      create_base_location: {
        Args: {
          p_base_fare: number
          p_base_km: number
          p_base_lat: number
          p_base_lng: number
          p_is_active: boolean
          p_is_default: boolean
          p_name: string
          p_per_km_fee: number
          p_priority: number
          p_service_type: string
        }
        Returns: {
          base_fare: number
          base_km: number
          base_lat: number
          base_lng: number
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          per_km_fee: number
          priority: number
          service_type: string
          updated_at: string
        }
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
      create_order: {
        Args: {
          p_center_id: string
          p_delivery_address: string
          p_delivery_phone: string
          p_order_items: Json
          p_user_id: string
        }
        Returns: string
      }
      delete_base_location: {
        Args: { p_id: string }
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
      generate_order_number: {
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
      get_available_centers: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string
          email: string
          id: string
          is_available: boolean
          latitude: number
          longitude: number
          name: string
          phone: string
        }[]
      }
      get_available_centers_for_location: {
        Args: { lat: number; lng: number; service_type: string }
        Returns: {
          center_id: string
          center_name: string
          geofence_id: string
          geofence_name: string
          priority: number
          store_id: string
          store_name: string
        }[]
      }
      get_base_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          base_fare: number
          base_km: number
          base_lat: number
          base_lng: number
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          per_km_fee: number
          priority: number
          service_type: string
          updated_at: string
        }[]
      }
      get_cached_recommendations: {
        Args: { user_id_param: string }
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_lab_booking_by_token: {
        Args: { booking_id: string; token: string }
        Returns: {
          id: string
          last_distance_meters: number
          last_eta_mins: number
          patient_name: string
          patient_phone: string
          status: string
          tracking_token: string
        }[]
      }
      get_latest_courier_location: {
        Args: { job_id: string; job_type: string }
        Returns: {
          accuracy_meters: number
          heading_degrees: number
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number
        }[]
      }
      get_order_by_token: {
        Args: { order_id: string; token: string }
        Returns: {
          id: string
          last_distance_meters: number
          last_eta_mins: number
          shipping_address: string
          status: string
          tracking_token: string
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_service_coverage: {
        Args: { lat: number; lng: number; service_type: string }
        Returns: {
          geofence_id: string
          geofence_name: string
          priority: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      has_admin_access: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_location_serviceable: {
        Args: { p_lat: number; p_lng: number; p_service_type: string }
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
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
          discount_price: number
          id: string
          image_url: string
          manufacturer: string
          name: string
          price: number
          score: number
        }[]
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
        Args: { recommendations: Json; user_id_param: string }
        Returns: undefined
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
      text: {
        Args: { "": unknown }
        Returns: string
      }
      universal_search: {
        Args: { limit_count?: number; query_text: string }
        Returns: {
          composition_family_key: string
          composition_key: string
          composition_match_type: string
          group_key: string
          href: string
          id: string
          is_alternative: boolean
          price: number
          rank_score: number
          subtitle: string
          thumbnail_url: string
          title: string
          type: string
        }[]
      }
      universal_search_v2: {
        Args: { max_per_group?: number; q: string }
        Returns: {
          composition_family_key: string
          composition_key: string
          composition_match_type: string
          group_key: string
          href: string
          id: string
          is_alternative: boolean
          price: number
          rank_score: number
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
      update_base_location: {
        Args: {
          p_base_fare: number
          p_base_km: number
          p_base_lat: number
          p_base_lng: number
          p_id: string
          p_is_active: boolean
          p_is_default: boolean
          p_name: string
          p_per_km_fee: number
          p_priority: number
          p_service_type: string
        }
        Returns: {
          base_fare: number
          base_km: number
          base_lat: number
          base_lng: number
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          per_km_fee: number
          priority: number
          service_type: string
          updated_at: string
        }
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
    }
    Enums: {
      app_role: "user" | "doctor" | "admin" | "lab"
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
      app_role: ["user", "doctor", "admin", "lab"],
    },
  },
} as const
