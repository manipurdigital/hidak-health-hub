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
  mrp?: number;
  discount_percentage?: number;
  discount_percent?: number;
  requires_prescription?: boolean;
  prescription_required?: boolean;
  prescription_type?: string;
  fast_delivery?: boolean;
  rating?: number;
  review_count?: number;
  thumbnail_url?: string;
  image_url?: string;
  manufacturer?: string;
  marketed_by?: string;
  composition?: string;
  salt_composition?: string;
  category_id?: string;
  description?: string;
  uses?: string;
  side_effects?: string;
  how_to_use?: string;
  how_it_works?: string;
  safety_advice?: string;
  what_if_you_forget?: string;
  facts?: string;
  substitute_available?: boolean;
  habit_forming?: boolean;
  therapeutic_class?: string;
  chemical_class?: string;
  action_class?: string;
  pack_size?: string;
  pack_size_unit?: string;
  dosage?: string;
  dosage_form?: string;
  dosage_strength?: string;
  route_of_administration?: string;
  storage_conditions?: string;
  country_of_origin?: string;
  expiry_date?: string;
  stock_quantity?: number;
  form?: string; // Legacy field
  faq?: any;
  key_highlights?: any;
  interaction_warnings?: any;
  alternative_brands?: any;
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