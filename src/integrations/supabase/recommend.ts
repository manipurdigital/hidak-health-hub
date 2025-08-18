import { supabase } from './client';

export interface RecParams {
  at?: Date;
  city?: string;
  pincode?: string;
  limit?: number;
}

export interface RecItem {
  medicine_id: string;
  name: string;
  thumbnail_url?: string;
  price?: number;
  score: number;
  expected_qty: number;
}

export async function recommendMedicinesForTime(params: RecParams): Promise<RecItem[]> {
  const {
    at = new Date(),
    city,
    pincode,
    limit = 10
  } = params;

  const { data, error } = await supabase.rpc('recommend_medicines_for_time', {
    at_ts: at.toISOString(),
    in_city: city || null,
    in_pincode: pincode || null,
    top_n: limit
  });

  if (error) {
    console.error('Error fetching medicine recommendations:', error);
    throw error;
  }

  return data || [];
}