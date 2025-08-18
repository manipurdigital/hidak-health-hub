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
    // Check serviceability with working hours and capacity validation
    const { data: assignment, error: assignError } = await supabase.rpc(
      'pick_center_for_job' as any,
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
        error: assignmentRow?.warnings?.[0] || 'No service centers available'
      };
    }

    // Get center details
    const tableName = serviceType === 'lab' ? 'diagnostic_centers' : 'stores';
    const { data: centerData, error: centerError } = await supabase
      .from(tableName)
      .select('id, name')
      .eq('id', assignmentRow.center_id)
      .single();

    const centerName = centerData?.name || 'Service Center';
    
    // Add status information based on warnings
    let statusInfo = '';
    if (assignmentRow.warnings && assignmentRow.warnings.length > 0) {
      statusInfo = ` (${assignmentRow.warnings.join(', ')})`;
    } else if (!assignmentRow.is_open) {
      statusInfo = ' (Currently closed)';
    } else if (assignmentRow.current_load > 0) {
      statusInfo = ` (Current load: ${assignmentRow.current_load})`;
    }

    return {
      isServiceable: true,
      center: {
        id: assignmentRow.center_id,
        name: centerName + statusInfo,
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
 * Get all serviceable centers for a location with validation
 */
export const getServiceableCenters = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number
): Promise<ServiceCenter[]> => {
  try {
    const { data, error } = await supabase.rpc('serviceable_centers' as any, {
      in_type: serviceType,
      in_lat: latitude,
      in_lng: longitude,
    });

    if (error) throw error;
    return data?.map(center => ({
      center_id: center.center_id,
      center_type: center.center_type,
      area_id: center.area_id,
      priority: center.priority,
      distance_m: center.distance_m
    })) || [];
  } catch (error) {
    console.error('Get serviceable centers error:', error);
    return [];
  }
};

/**
 * Pick the best center for a job with enhanced validation
 */
export const pickCenterForJob = async (
  serviceType: 'lab' | 'delivery',
  latitude: number,
  longitude: number,
  useLoadBalancing = true,
  allowClosed = false
): Promise<CenterAssignment | null> => {
  try {
    const rpcFunction = useLoadBalancing 
      ? 'pick_center_with_load_balancing' 
      : 'pick_center_for_job';

    const { data, error } = await supabase.rpc(rpcFunction as any, {
      in_type: serviceType,
      in_lat: latitude,
      in_lng: longitude,
      allow_closed: allowClosed
    });

    if (error) throw error;
    
    // The RPC returns a single row, not an array
    const result = Array.isArray(data) ? data[0] : data;
    
    if (!result || !result.center_id) {
      return null;
    }

    return {
      center_id: result.center_id,
      reason: result.reason,
      current_load: result.current_load
    };
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