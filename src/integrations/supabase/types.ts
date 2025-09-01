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
          name: string
          postal_code: string
          state: string
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
          name: string
          postal_code: string
          state: string
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
          name?: string
          postal_code?: string
          state?: string
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
          created_at: string | null
          day_of_week: number | null
          doctor_id: string | null
          end_time: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          doctor_id?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
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
      lab_bookings: {
        Row: {
          assignment_notes: string | null
          booking_date: string
          booking_time: string
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
          booking_time: string
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
          booking_time?: string
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
          id: string
          report_data: Json | null
          report_url: string | null
          status: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json | null
          report_url?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json | null
          report_url?: string | null
          status?: string | null
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
          brand: string | null
          category_id: string | null
          composition: string | null
          composition_family_key: string | null
          composition_key: string | null
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          discount_price: number | null
          dosage_form: string | null
          fast_delivery: boolean | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_available: boolean | null
          manufacturer: string | null
          min_stock_level: number | null
          name: string
          original_price: number | null
          pack_size: string | null
          prescription_required: boolean | null
          price: number
          rating: number | null
          requires_prescription: boolean | null
          review_count: number | null
          stock_quantity: number | null
          strength: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category_id?: string | null
          composition?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          dosage_form?: string | null
          fast_delivery?: boolean | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          manufacturer?: string | null
          min_stock_level?: number | null
          name: string
          original_price?: number | null
          pack_size?: string | null
          prescription_required?: boolean | null
          price: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          stock_quantity?: number | null
          strength?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category_id?: string | null
          composition?: string | null
          composition_family_key?: string | null
          composition_key?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          discount_price?: number | null
          dosage_form?: string | null
          fast_delivery?: boolean | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          manufacturer?: string | null
          min_stock_level?: number | null
          name?: string
          original_price?: number | null
          pack_size?: string | null
          prescription_required?: boolean | null
          price?: number
          rating?: number | null
          requires_prescription?: boolean | null
          review_count?: number | null
          stock_quantity?: number | null
          strength?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
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
      [_ in never]: never
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
        Args: { end_date: string; limit_count: number; start_date: string }
        Returns: {
          medicine_name: string
          order_count: number
          total_quantity: number
          total_revenue: number
          unique_customers: number
        }[]
      }
      check_medicine_availability: {
        Args: { p_medicine_id: string; p_quantity: number }
        Returns: boolean
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
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
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
        Args: { p_lat: number; p_lng: number; p_radius?: string }
        Returns: {
          address: string
          distance_km: number
          email: string
          id: string
          is_available: boolean
          latitude: number
          longitude: number
          name: string
          phone: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
