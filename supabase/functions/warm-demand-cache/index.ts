import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PopularLocation {
  city?: string;
  pincode?: string;
  priority: number;
}

// Popular cities and pincodes to pre-warm cache for
const POPULAR_LOCATIONS: PopularLocation[] = [
  // Major cities
  { city: 'Mumbai', priority: 1 },
  { city: 'Delhi', priority: 1 },
  { city: 'Bangalore', priority: 1 },
  { city: 'Chennai', priority: 1 },
  { city: 'Kolkata', priority: 1 },
  { city: 'Hyderabad', priority: 1 },
  { city: 'Pune', priority: 2 },
  { city: 'Ahmedabad', priority: 2 },
  { city: 'Surat', priority: 2 },
  { city: 'Jaipur', priority: 2 },
  
  // Popular pincodes (examples - replace with actual popular ones)
  { pincode: '400001', priority: 1 }, // Mumbai
  { pincode: '110001', priority: 1 }, // Delhi
  { pincode: '560001', priority: 1 }, // Bangalore
  { pincode: '600001', priority: 1 }, // Chennai
  { pincode: '700001', priority: 1 }, // Kolkata
  
  // Global fallback
  { priority: 3 }, // No city/pincode - global recommendations
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting demand cache warming...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Clean expired cache entries first
    console.log('Cleaning expired cache entries...');
    const { data: cleanupResult, error: cleanupError } = await supabase.rpc('clean_expired_cache');
    
    if (cleanupError) {
      console.error('Error cleaning cache:', cleanupError);
    } else {
      console.log(`Cleaned ${cleanupResult} expired cache entries`);
    }
    
    const currentTime = new Date();
    const stats = {
      processed: 0,
      cached: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    // Warm cache for different hours (current, +1, +2 hours to cover upcoming demand)
    const hoursToWarm = [0, 1, 2];
    const limitsToWarm = [10, 20]; // Different limits for different use cases
    
    for (const hourOffset of hoursToWarm) {
      const targetTime = new Date(currentTime.getTime() + (hourOffset * 60 * 60 * 1000));
      
      // Sort locations by priority (higher priority = lower number = processed first)
      const sortedLocations = POPULAR_LOCATIONS.sort((a, b) => a.priority - b.priority);
      
      for (const location of sortedLocations) {
        for (const limit of limitsToWarm) {
          stats.processed++;
          
          try {
            // Check if we already have valid cache for this location/time
            const { data: cachedData, error: cacheCheckError } = await supabase.rpc(
              'get_cached_recommendations',
              {
                at_ts: targetTime.toISOString(),
                in_city: location.city || null,
                in_pincode: location.pincode || null,
                top_n: limit
              }
            );
            
            if (cacheCheckError) {
              console.error('Cache check error:', cacheCheckError);
              continue;
            }
            
            // Skip if we already have valid cache
            if (cachedData && cachedData.length > 0) {
              console.log(`Cache hit for ${location.city || location.pincode || 'global'} at ${targetTime.toISOString()}`);
              continue;
            }
            
            // Get fresh recommendations
            console.log(`Warming cache for ${location.city || location.pincode || 'global'} at ${targetTime.toISOString()}, limit: ${limit}`);
            
            const { data: recommendations, error: recError } = await supabase.rpc(
              'recommend_medicines_for_time',
              {
                at_ts: targetTime.toISOString(),
                in_city: location.city || null,
                in_pincode: location.pincode || null,
                top_n: limit
              }
            );
            
            if (recError) {
              console.error('Recommendation error:', recError);
              stats.errors++;
              continue;
            }
            
            // Only cache if we got meaningful results
            if (recommendations && recommendations.length > 0) {
              const { error: setCacheError } = await supabase.rpc(
                'set_cached_recommendations',
                {
                  at_ts: targetTime.toISOString(),
                  in_city: location.city || null,
                  in_pincode: location.pincode || null,
                  top_n: limit,
                  recommendations_data: recommendations
                }
              );
              
              if (setCacheError) {
                console.error('Set cache error:', setCacheError);
                stats.errors++;
              } else {
                stats.cached++;
                console.log(`Cached ${recommendations.length} recommendations for ${location.city || location.pincode || 'global'}`);
              }
            }
            
            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Error processing location ${location.city || location.pincode || 'global'}:`, error);
            stats.errors++;
          }
        }
      }
    }
    
    const duration = Date.now() - stats.startTime;
    const result = {
      success: true,
      message: 'Cache warming completed',
      stats: {
        ...stats,
        durationMs: duration
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Cache warming completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Cache warming failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});