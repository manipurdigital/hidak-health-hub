import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type StorePartner = { geofence_id: string; geofence_name: string; priority: number; store_id: string; store_name: string };
type LabPartner   = { geofence_id: string; geofence_name: string; priority: number; center_id: string; center_name: string };

type FeePreview = { distance_km: number; fee: number; geofence_id?: string; geofence_name?: string } | null;

type Location = { lat: number; lng: number; address?: string };

type ServiceabilityState = {
  location: Location | null;
  inDeliveryArea: boolean | null;  // null = unknown
  inLabArea: boolean | null;       // null = unknown
  partnersDelivery: StorePartner[];
  partnersLab: LabPartner[];
  feePreview: FeePreview;
  loading: boolean;
  error: string | null;
  // actions
  autoDetect: () => Promise<void>;
  setManualLocation: (loc: Location) => Promise<void>;
  refresh: () => Promise<void>;
  // Legacy compatibility fields derived from new state
  visibleStores: StorePartner[];
  visibleLabs: LabPartner[];
  topStore: StorePartner | null;
  topLabCenter: LabPartner | null;
  deliveryCoverage: 'has_partners' | 'available_no_partner' | 'out_of_area' | null;
  labCoverage: 'has_partners' | 'available_no_partner' | 'out_of_area' | null;
  deliveryFeeEstimate: number | null;
  lastCheckedAt: number | null;
};

// 60 minutes TTL for cache
const CACHE_KEY = 'svc:state:v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

const ServiceabilityCtx = createContext<ServiceabilityState | null>(null);

export const useServiceability = () => {
  const ctx = useContext(ServiceabilityCtx);
  if (!ctx) throw new Error('useServiceability must be used within ServiceabilityProvider');
  return ctx;
};

function normalizeService(s: string) {
  const x = s.toLowerCase();
  if (x === 'lab') return 'lab_collection';
  if (x === 'medicine') return 'delivery';
  return x;
}

async function rpc<T>(fn: string, args: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.rpc(fn as any, args);
  if (error) throw error;
  return (data as T) ?? ([] as any);
}

async function getPartners(lat: number, lng: number, serviceType: 'delivery'|'lab_collection') {
  return rpc<any[]>('get_available_centers_for_location', { lat, lng, service_type: serviceType });
}

async function getCoverage(lat: number, lng: number, serviceType: 'delivery'|'lab_collection') {
  return rpc<any[]>('get_service_coverage', { lat, lng, service_type: serviceType });
}

async function previewDeliveryFee(lat: number, lng: number) {
  const rows = await rpc<any[]>('calc_distance_fee_from_geofence', {
    p_service: 'delivery',
    p_dest_lat: lat,
    p_dest_lng: lng,
  });
  return rows?.[0] ?? null;
}

type Cached = {
  at: number;
  location: Location;
  partnersDelivery: StorePartner[];
  partnersLab: LabPartner[];
  inDeliveryArea: boolean;
  inLabArea: boolean;
  feePreview: FeePreview;
};

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Cached;
    if (Date.now() - obj.at > CACHE_TTL_MS) return null;
    return obj;
  } catch { return null; }
}

function writeCache(c: Cached) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

export const ServiceabilityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [partnersDelivery, setPartnersDelivery] = useState<StorePartner[]>([]);
  const [partnersLab, setPartnersLab] = useState<LabPartner[]>([]);
  const [inDeliveryArea, setInDeliveryArea] = useState<boolean | null>(null);
  const [inLabArea, setInLabArea] = useState<boolean | null>(null);
  const [feePreview, setFeePreview] = useState<FeePreview>(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState<string | null>(null);

  // Hydrate from cache once
  const hydrated = useRef(false);
  if (!hydrated.current) {
    hydrated.current = true;
    const c = readCache();
    if (c) {
      setLocation(c.location);
      setPartnersDelivery(c.partnersDelivery || []);
      setPartnersLab(c.partnersLab || []);
      setInDeliveryArea(c.inDeliveryArea);
      setInLabArea(c.inLabArea);
      setFeePreview(c.feePreview ?? null);
    }
  }

  const computeAndCache = useCallback(async (loc: Location) => {
    setLoading(true); setErr(null);
    try {
      // 1) partners for both services
      const [pDel, pLab] = await Promise.all([
        getPartners(loc.lat, loc.lng, 'delivery'),
        getPartners(loc.lat, loc.lng, 'lab_collection'),
      ]);

      const sortedDel = (pDel || []).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      const sortedLab = (pLab || []).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

      setPartnersDelivery(sortedDel);
      setPartnersLab(sortedLab);

      // 2) coverage (only if no partners)
      let coveredDelivery = sortedDel.length > 0;
      let coveredLab = sortedLab.length > 0;

      if (!coveredDelivery) {
        const cov = await getCoverage(loc.lat, loc.lng, 'delivery');
        coveredDelivery = (cov && cov.length > 0) || false;
      }
      if (!coveredLab) {
        const cov = await getCoverage(loc.lat, loc.lng, 'lab_collection');
        coveredLab = (cov && cov.length > 0) || false;
      }

      setInDeliveryArea(coveredDelivery);
      setInLabArea(coveredLab);

      // 3) fee preview (only if delivery coverage)
      let fee: FeePreview = null;
      if (coveredDelivery) {
        fee = await previewDeliveryFee(loc.lat, loc.lng);
      }
      setFeePreview(fee);

      // 4) cache
      writeCache({
        at: Date.now(),
        location: loc,
        partnersDelivery: sortedDel,
        partnersLab: sortedLab,
        inDeliveryArea: coveredDelivery,
        inLabArea: coveredLab,
        feePreview: fee,
      });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const autoDetect = useCallback(async () => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        setErr('Geolocation not supported'); reject(new Error('no geolocation')); return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          await computeAndCache(loc);
          resolve();
        },
        (err) => { setErr(err.message || 'Location permission denied'); reject(err); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [computeAndCache]);

  const setManualLocation = useCallback(async (loc: Location) => {
    setLocation(loc);
    await computeAndCache(loc);
  }, [computeAndCache]);

  const refresh = useCallback(async () => {
    if (!location) return;
    await computeAndCache(location);
  }, [computeAndCache, location]);

  // Legacy compatibility derived fields
  const deliveryCoverage = useMemo(() => {
    if (inDeliveryArea === null) return null;
    if (partnersDelivery.length > 0) return 'has_partners';
    if (inDeliveryArea) return 'available_no_partner';
    return 'out_of_area';
  }, [inDeliveryArea, partnersDelivery.length]);

  const labCoverage = useMemo(() => {
    if (inLabArea === null) return null;
    if (partnersLab.length > 0) return 'has_partners';
    if (inLabArea) return 'available_no_partner';
    return 'out_of_area';
  }, [inLabArea, partnersLab.length]);

  const value = useMemo<ServiceabilityState>(() => ({
    location,
    inDeliveryArea, inLabArea,
    partnersDelivery, partnersLab,
    feePreview,
    loading, error,
    autoDetect, setManualLocation, refresh,
    // Legacy compatibility
    visibleStores: partnersDelivery,
    visibleLabs: partnersLab,
    topStore: partnersDelivery[0] || null,
    topLabCenter: partnersLab[0] || null,
    deliveryCoverage,
    labCoverage,
    deliveryFeeEstimate: feePreview?.fee ?? null,
    lastCheckedAt: Date.now(),
  }), [location, inDeliveryArea, inLabArea, partnersDelivery, partnersLab, feePreview, loading, error, autoDetect, setManualLocation, refresh, deliveryCoverage, labCoverage]);

  return <ServiceabilityCtx.Provider value={value}>{children}</ServiceabilityCtx.Provider>;
};