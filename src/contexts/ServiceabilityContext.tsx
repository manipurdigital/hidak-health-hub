import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCheckServiceability } from '@/hooks/geofencing-hooks';

interface ServiceabilityLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface ServiceCenter {
  geofence_id?: string;
  geofence_name: string;
  priority: number;
  center_id?: string;
  center_name?: string;
  store_id?: string;
  store_name?: string;
}

interface ServiceabilityState {
  location: ServiceabilityLocation | null;
  visibleStores: ServiceCenter[];
  visibleLabs: ServiceCenter[];
  topStore: ServiceCenter | null;
  topLabCenter: ServiceCenter | null;
  deliveryCoverage: 'has_partners' | 'available_no_partner' | 'out_of_area' | null;
  labCoverage: 'has_partners' | 'available_no_partner' | 'out_of_area' | null;
  deliveryFeeEstimate: number | null;
  loading: boolean;
  error: string | null;
  lastCheckedAt: number | null;
}

interface ServiceabilityContextType extends ServiceabilityState {
  autoDetect: () => Promise<void>;
  setManualLocation: (location: ServiceabilityLocation) => Promise<void>;
  refresh: () => Promise<void>;
}

const ServiceabilityContext = createContext<ServiceabilityContextType | undefined>(undefined);

const CACHE_KEY = 'serviceability_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface ServiceabilityProviderProps {
  children: ReactNode;
}

export const ServiceabilityProvider = ({ children }: ServiceabilityProviderProps) => {
  const [state, setState] = useState<ServiceabilityState>({
    location: null,
    visibleStores: [],
    visibleLabs: [],
    topStore: null,
    topLabCenter: null,
    deliveryCoverage: null,
    labCoverage: null,
    deliveryFeeEstimate: null,
    loading: false,
    error: null,
    lastCheckedAt: null,
  });

  const checkServiceability = useCheckServiceability();

  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.lastCheckedAt && Date.now() - data.lastCheckedAt < CACHE_TTL) {
          setState(data);
          console.debug('Loaded serviceability from cache');
        } else {
          localStorage.removeItem(CACHE_KEY);
          console.debug('Cache expired, removed');
        }
      } catch (error) {
        console.error('Failed to parse serviceability cache:', error);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  const saveToCache = (newState: ServiceabilityState) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save serviceability cache:', error);
    }
  };

  const fetchServiceability = async (lat: number, lng: number, address?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    console.debug('Fetching serviceability for:', { lat, lng });

    try {
      const [stores, labs] = await Promise.all([
        checkServiceability.mutateAsync({ lat, lng, serviceType: 'delivery' }),
        checkServiceability.mutateAsync({ lat, lng, serviceType: 'lab_collection' }),
      ]);

      const sortedStores = (stores || []).sort((a, b) => b.priority - a.priority);
      const sortedLabs = (labs || []).sort((a, b) => b.priority - a.priority);

      // Determine coverage status
      const deliveryCoverage = sortedStores.length > 0 ? 'has_partners' : 'available_no_partner';
      const labCoverage = sortedLabs.length > 0 ? 'has_partners' : 'available_no_partner';

      // For now, use a simple distance-based fee calculation
      // TODO: Replace with actual RPC when calc_distance_fee_from_geofence is available
      const deliveryFeeEstimate = 50; // Default fee in case RPC is not available

      const newState: ServiceabilityState = {
        location: { lat, lng, address },
        visibleStores: sortedStores,
        visibleLabs: sortedLabs,
        topStore: sortedStores[0] || null,
        topLabCenter: sortedLabs[0] || null,
        deliveryCoverage,
        labCoverage,
        deliveryFeeEstimate,
        loading: false,
        error: null,
        lastCheckedAt: Date.now(),
      };

      setState(newState);
      saveToCache(newState);
      console.debug('Serviceability updated:', { stores: sortedStores.length, labs: sortedLabs.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check serviceability';
      console.error('Serviceability check failed:', error);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  };

  const autoDetect = async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      await fetchServiceability(lat, lng);
    } catch (error) {
      console.debug('GPS permission denied or failed:', error);
      // Don't show error toast for GPS denial - user can use manual location
    }
  };

  const setManualLocation = async (location: ServiceabilityLocation) => {
    await fetchServiceability(location.lat, location.lng, location.address);
  };

  const refresh = async () => {
    if (state.location) {
      await fetchServiceability(state.location.lat, state.location.lng, state.location.address);
    }
  };

  const contextValue: ServiceabilityContextType = {
    ...state,
    autoDetect,
    setManualLocation,
    refresh,
  };

  return (
    <ServiceabilityContext.Provider value={contextValue}>
      {children}
    </ServiceabilityContext.Provider>
  );
};

export const useServiceability = (): ServiceabilityContextType => {
  const context = useContext(ServiceabilityContext);
  if (context === undefined) {
    throw new Error('useServiceability must be used within a ServiceabilityProvider');
  }
  return context;
};