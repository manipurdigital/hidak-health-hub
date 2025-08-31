// Global type definitions

export interface SearchSuggestionGroup {
  id: string;
  name: string;
  items: SearchResult[];
  type?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  price?: number;
  subtitle?: string;
  thumbnail_url?: string;
  href?: string;
  is_alternative?: boolean;
  composition_match_type?: string;
}

export interface Medicine {
  id: string;
  name: string;
  price: number;
  brand?: string;
  original_price?: number;
  discount_percentage?: number;
  requires_prescription?: boolean;
  fast_delivery?: boolean;
  rating?: number;
  review_count?: number;
  thumbnail_url?: string;
  manufacturer?: string;
  composition?: string;
  category_id?: string;
  description?: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  category?: string;
  sample_type?: string;
  reporting_time?: string;
  preparation_required?: boolean;
  description?: string;
  normal_range?: string;
  preparation_instructions?: string;
  is_available?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface TrendingMedicine {
  id: string;
  name: string;
  price: number;
  thumbnail_url?: string;
}

export interface Doctor {
  id: string;
  name: string;
  full_name?: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
  rating: number;
  review_count: number;
  languages: string[];
  hospital_affiliation: string;
  bio: string;
  qualification: string;
  profile_image_url?: string;
  is_verified: boolean;
  user_id?: string;
  created_at?: string;
}

export interface Address {
  id: string;
  name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}