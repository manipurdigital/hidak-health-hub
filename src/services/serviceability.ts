import { supabase } from '@/integrations/supabase/client';

export interface ServiceabilityResult {
  isServiceable: boolean;
  center?: {
    id: string;
    name: string;
    reason: string;
    distance?: number;
  };
  error?: string;
}

export interface ServiceCenter {
  center_id: string;
  center_type: string;
  area_id: string;
  priority: number;
  distance_m: number;
}

export interface CenterAssignment {
  center_id: string;
  reason: string;
  current_load?: number;
}

/**
 * Check if a location is serviceable for a given service type
 */
export const checkServiceability = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number
): Promise<ServiceabilityResult> => {
  try {
    // First check if location is serviceable
    const { data: isServiceable, error: serviceError } = await supabase.rpc(
      'is_location_serviceable',
      {
        in_type: serviceType,
        in_lat: latitude,
        in_lng: longitude,
      }
    );

    if (serviceError) throw serviceError;

    if (!isServiceable) {
      return {
        isServiceable: false,
        error: 'Service not available in your area'
      };
    }

    // Get assigned center
    const { data: assignment, error: assignError } = await supabase.rpc(
      'pick_center_with_load_balancing',
      {
        in_type: serviceType,
        in_lat: latitude,
        in_lng: longitude,
      }
    );

    if (assignError) throw assignError;

    // The RPC returns a single row, not an array
    const assignmentRow = Array.isArray(assignment) ? assignment[0] : assignment;

    if (!assignmentRow || !assignmentRow.center_id) {
      return {
        isServiceable: false,
        error: 'No service centers available'
      };
    }

    // Get center details
    const tableName = serviceType === 'lab' ? 'diagnostic_centers' : 'stores';
    const { data: centerData, error: centerError } = await supabase
      .from(tableName)
      .select('id, name')
      .eq('id', assignmentRow.center_id)
      .single();

    if (centerError || !centerData) {
      return {
        isServiceable: true,
        center: {
          id: assignmentRow.center_id,
          name: 'Service Center',
          reason: assignmentRow.reason,
        }
      };
    }

    return {
      isServiceable: true,
      center: {
        id: assignmentRow.center_id,
        name: centerData.name,
        reason: assignmentRow.reason,
      }
    };

  } catch (error) {
    console.error('Serviceability check error:', error);
    return {
      isServiceable: false,
      error: 'Unable to check serviceability at the moment'
    };
  }
};

/**
 * Get all serviceable centers for a location
 */
export const getServiceableCenters = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number
): Promise<ServiceCenter[]> => {
  try {
    const { data, error } = await supabase.rpc('serviceable_centers', {
      in_type: serviceType,
      in_lat: latitude,
      in_lng: longitude,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get serviceable centers error:', error);
    return [];
  }
};

/**
 * Pick the best center for a job
 */
export const pickCenterForJob = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number,
  useLoadBalancing = true
): Promise<CenterAssignment | null> => {
  try {
    const rpcFunction = useLoadBalancing 
      ? 'pick_center_with_load_balancing' 
      : 'pick_center_for_job';

    const { data, error } = await supabase.rpc(rpcFunction, {
      in_type: serviceType,
      in_lat: latitude,
      in_lng: longitude,
    });

    if (error) throw error;
    
    // The RPC returns a single row, not an array
    const result = Array.isArray(data) ? data[0] : data;
    return result || null;
  } catch (error) {
    console.error('Pick center error:', error);
    return null;
  }
};

/**
 * Get service area information for a location
 */
export const getServiceAreaInfo = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number
) => {
  try {
    const { data, error } = await supabase.rpc('get_service_area_info', {
      in_type: serviceType,
      in_lat: latitude,
      in_lng: longitude,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get service area info error:', error);
    return [];
  }
};