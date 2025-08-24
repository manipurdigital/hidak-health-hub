import { supabase } from '@/integrations/supabase/client';

// Interface definitions
export interface ServiceabilityResult {
  isServiceable: boolean;
  center?: ServiceCenter;
  error?: string;
}

export interface ServiceCenter {
  id: string;
  name?: string;
  type: 'lab' | 'delivery';
  area: string;
  priority: number;
  distance?: number;
}

export interface CenterAssignment {
  center_id: string;
  reason: string;
  current_load?: number;
}

export function normalizeService(s: string): 'delivery' | 'lab_collection' {
  const x = s.toLowerCase();
  if (x === 'lab') return 'lab_collection';
  if (x === 'medicine') return 'delivery';
  return x as 'delivery' | 'lab_collection';
}

async function rpc<T>(fn: string, args: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as any, args);
  if (error) throw error;
  return (data as T) ?? ([] as any);
}

// Check if a given latitude and longitude are serviceable for a specified service type
export const checkServiceability = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number
): Promise<ServiceabilityResult> => {
  try {
    const normalizedServiceType = normalizeService(serviceType);
    const { data, error } = await supabase.rpc('get_available_centers_for_location' as any, {
      lat: latitude,
      lng: longitude,
      service_type: normalizedServiceType,
    });

    if (error) {
      console.error('Serviceability check error:', error);
      return {
        isServiceable: false,
        error: error.message,
      };
    }

    if (data && data.length > 0) {
      const center = data[0];
      return {
        isServiceable: true,
        center: {
          id: center.center_id || center.store_id,
          name: center.center_name || center.store_name,
          type: serviceType,
          area: center.geofence_name || 'Unknown',
          priority: center.priority || 0,
          distance: 0,
        },
      };
    }

    return {
      isServiceable: false,
      error: 'No service centers available in this area',
    };
  } catch (error) {
    console.error('Serviceability check error:', error);
    return {
      isServiceable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Pick the best service center for a job
export const pickCenterForJob = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number,
  useLoadBalancing = false,
  allowClosed = false
): Promise<CenterAssignment | null> => {
  try {
    const normalizedServiceType = normalizeService(serviceType);
    // For now, use the same function as checkServiceability to get available centers
    const { data, error } = await supabase.rpc('get_available_centers_for_location' as any, {
      lat: latitude,
      lng: longitude,
      service_type: normalizedServiceType,
    });

    if (error) {
      console.error('Center assignment error:', error);
      return null;
    }

    if (data && data.length > 0) {
      const center = data[0];
      return {
        center_id: center.center_id || center.store_id,
        reason: 'Auto-assigned based on location',
        current_load: 0,
      };
    }

    return null;
  } catch (error) {
    console.error('Center assignment error:', error);
    return null;
  }
};

export async function getCoverage(lat: number, lng: number, serviceType: 'delivery' | 'lab_collection') {
  return rpc<any[]>('get_service_coverage', { lat, lng, service_type: serviceType });
}

export async function previewDeliveryFee(lat: number, lng: number) {
  const rows = await rpc<any[]>('calc_distance_fee_from_geofence', {
    p_service: 'delivery',
    p_dest_lat: lat,
    p_dest_lng: lng,
  });
  return rows?.[0] ?? null;
}