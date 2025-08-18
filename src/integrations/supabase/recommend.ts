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

  // Try to get from cache first
  const { data: cachedData, error: cacheError } = await supabase.rpc('get_cached_recommendations', {
    at_ts: at.toISOString(),
    in_city: city || null,
    in_pincode: pincode || null,
    top_n: limit
  });

  // If we have valid cached data, return it
  if (!cacheError && cachedData) {
    console.log('Using cached recommendations');
    return cachedData as unknown as RecItem[];
  }

  // Otherwise, get fresh data from the RPC
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

  // Cache the fresh results for future use (fire and forget)
  if (data && data.length > 0) {
    try {
      await supabase.rpc('set_cached_recommendations', {
        at_ts: at.toISOString(),
        in_city: city || null,
        in_pincode: pincode || null,
        top_n: limit,
        recommendations_data: data
      });
      console.log('Cached fresh recommendations');
    } catch (err) {
      console.warn('Failed to cache recommendations:', err);
    }
  }

  return data || [];
}