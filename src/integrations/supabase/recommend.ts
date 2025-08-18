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

  // Try to get cached recommendations first
  const { data: cachedData, error: cacheError } = await supabase.rpc('get_cached_recommendations', {
    at_ts: at.toISOString(),
    in_city: city || null,
    in_pincode: pincode || null,
    top_n: limit
  });

  // If we have valid cached data, return it
  if (!cacheError && cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
    console.log('Cache hit for recommendations');
    return cachedData as unknown as RecItem[];
  }

  // Otherwise, get fresh recommendations from the RPC
  console.log('Cache miss, fetching fresh recommendations');
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

  // Cache the fresh results for next time (fire and forget)
  if (data && Array.isArray(data) && data.length > 0) {
    // Fire and forget - don't await this
    supabase.rpc('set_cached_recommendations', {
      at_ts: at.toISOString(),
      in_city: city || null,
      in_pincode: pincode || null,
      top_n: limit,
      recommendations_data: data
    });
  }

  return data || [];
}
