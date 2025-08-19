import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T, ttlMs = 30000): void {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttlMs
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global LRU cache instances
const searchCache = new LRUCache<any>(50);
const queryCache = new LRUCache<any>(100);

export class PerformanceCache {
  // Browser-side LRU cache with 30s TTL
  static async getFromBrowserCache<T>(key: string): Promise<T | null> {
    if (key.startsWith('search:')) {
      return searchCache.get(key);
    }
    return queryCache.get(key);
  }

  static setBrowserCache<T>(key: string, data: T, ttlMs = 30000): void {
    if (key.startsWith('search:')) {
      searchCache.set(key, data, ttlMs);
    } else {
      queryCache.set(key, data, ttlMs);
    }
  }

  // Server-side cache via Supabase
  static async getFromServerCache<T>(key: string): Promise<T | null> {
    try {
      const { data } = await supabase
        .from('query_cache')
        .select('cache_value')
        .eq('cache_key', key)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      return data?.cache_value || null;
    } catch (error) {
      console.warn('Server cache read failed:', error);
      return null;
    }
  }

  static async setServerCache<T>(
    key: string, 
    data: T, 
    ttlSeconds = 30
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      await supabase
        .from('query_cache')
        .upsert({
          cache_key: key,
          cache_value: data,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.warn('Server cache write failed:', error);
    }
  }

  // Combined cache strategy
  static async get<T>(key: string): Promise<T | null> {
    // Try browser cache first (fastest)
    let result = await this.getFromBrowserCache<T>(key);
    if (result) return result;

    // Fallback to server cache
    result = await this.getFromServerCache<T>(key);
    if (result) {
      // Backfill browser cache
      this.setBrowserCache(key, result);
      return result;
    }

    return null;
  }

  static async set<T>(
    key: string, 
    data: T, 
    browserTtlMs = 30000,
    serverTtlSeconds = 30
  ): Promise<void> {
    // Set in both caches
    this.setBrowserCache(key, data, browserTtlMs);
    await this.setServerCache(key, data, serverTtlSeconds);
  }

  static clearBrowserCache(): void {
    searchCache.clear();
    queryCache.clear();
  }
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static startTimes = new Map<string, number>();

  static startTimer(requestId: string): void {
    this.startTimes.set(requestId, Date.now());
  }

  static async endTimer(
    requestId: string,
    endpoint: string,
    method = 'GET',
    statusCode = 200,
    queryCount = 0,
    cacheHit = false
  ): Promise<void> {
    const startTime = this.startTimes.get(requestId);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.startTimes.delete(requestId);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${method} ${endpoint}: ${duration}ms (cache: ${cacheHit})`);
    }

    // Store in database for analytics
    try {
      await supabase
        .from('performance_logs')
        .insert({
          endpoint,
          method,
          duration_ms: duration,
          status_code: statusCode,
          request_id: requestId,
          query_count: queryCount,
          cache_hit: cacheHit
        });
    } catch (error) {
      console.warn('Failed to log performance data:', error);
    }
  }

  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Search cache wrapper
export async function cachedSearch<T>(
  searchKey: string,
  searchFn: () => Promise<T>,
  ttlMs = 30000
): Promise<T> {
  const cacheKey = `search:${searchKey}`;
  const requestId = PerformanceMonitor.generateRequestId();
  
  PerformanceMonitor.startTimer(requestId);

  // Try cache first
  const cached = await PerformanceCache.get<T>(cacheKey);
  if (cached) {
    await PerformanceMonitor.endTimer(
      requestId, 
      `/search/${searchKey}`, 
      'GET', 
      200, 
      0, 
      true
    );
    return cached;
  }

  // Execute search
  const result = await searchFn();
  
  // Cache result
  await PerformanceCache.set(cacheKey, result, ttlMs, 30);
  
  await PerformanceMonitor.endTimer(
    requestId, 
    `/search/${searchKey}`, 
    'GET', 
    200, 
    1, 
    false
  );

  return result;
}