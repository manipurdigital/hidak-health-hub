import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Clock, Database, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';

interface PerformanceStats {
  p50: number;
  p95: number;
  p99: number;
  avgDuration: number;
  totalRequests: number;
  cacheHitRate: number;
}

interface EndpointPerformance {
  endpoint: string;
  method: string;
  stats: PerformanceStats;
  slowQueries: Array<{
    id: string;
    duration_ms: number;
    created_at: string;
    cache_hit: boolean;
  }>;
}

export default function AdminPerformancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [performanceData, setPerformanceData] = useState<EndpointPerformance[]>([]);
  const [overallStats, setOverallStats] = useState<PerformanceStats | null>(null);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    try {
      const hoursBack = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Get performance logs
      const { data: logs } = await supabase
        .from('performance_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false });

      if (!logs) return;

      // Calculate overall stats
      const durations = logs.map(log => log.duration_ms).sort((a, b) => a - b);
      const cacheHits = logs.filter(log => log.cache_hit).length;
      
      const overall: PerformanceStats = {
        p50: calculatePercentile(durations, 50),
        p95: calculatePercentile(durations, 95),
        p99: calculatePercentile(durations, 99),
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        totalRequests: logs.length,
        cacheHitRate: logs.length > 0 ? (cacheHits / logs.length) * 100 : 0
      };

      setOverallStats(overall);

      // Group by endpoint
      const endpointGroups = logs.reduce((acc, log) => {
        const key = `${log.method} ${log.endpoint}`;
        if (!acc[key]) {
          acc[key] = { endpoint: log.endpoint, method: log.method, logs: [] };
        }
        acc[key].logs.push(log);
        return acc;
      }, {} as Record<string, any>);

      // Calculate stats per endpoint
      const endpointStats: EndpointPerformance[] = Object.values(endpointGroups)
        .map((group: any) => {
          const durations = group.logs.map((log: any) => log.duration_ms).sort((a: number, b: number) => a - b);
          const cacheHits = group.logs.filter((log: any) => log.cache_hit).length;
          const slowQueries = group.logs
            .filter((log: any) => log.duration_ms > calculatePercentile(durations, 95))
            .slice(0, 5);

          return {
            endpoint: group.endpoint,
            method: group.method,
            stats: {
              p50: calculatePercentile(durations, 50),
              p95: calculatePercentile(durations, 95),
              p99: calculatePercentile(durations, 99),
              avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
              totalRequests: group.logs.length,
              cacheHitRate: group.logs.length > 0 ? (cacheHits / group.logs.length) * 100 : 0
            },
            slowQueries
          };
        })
        .sort((a, b) => b.stats.p95 - a.stats.p95);

      setPerformanceData(endpointStats);
    } catch (error) {
      toast({
        title: "Failed to load performance data",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculatePercentile = (sortedArray: number[], percentile: number): number => {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * (percentile / 100)) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPerformanceData();
  };

  const clearCache = async () => {
    try {
      await supabase.rpc('cleanup_query_cache');
      toast({
        title: "Cache cleared",
        description: "Query cache has been cleared successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to clear cache",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getPerformanceBadge = (p95: number) => {
    if (p95 < 300) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (p95 < 500) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (p95 < 1000) return <Badge variant="outline" className="bg-orange-100 text-orange-800">Needs Attention</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Analytics</h1>
            <p className="text-muted-foreground">Monitor P50/P95/P99 metrics and optimize slow queries</p>
          </div>
          <div className="flex items-center space-x-2">
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList>
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={clearCache}>
              <Database className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                  P95 Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(overallStats.p95)}ms</div>
                <div className="mt-1">{getPerformanceBadge(overallStats.p95)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-600" />
                  Average Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(overallStats.avgDuration)}ms</div>
                <div className="text-xs text-muted-foreground">P50: {Math.round(overallStats.p50)}ms</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-purple-600" />
                  Cache Hit Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.cacheHitRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">
                  {overallStats.totalRequests} total requests
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
                  P99 Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(overallStats.p99)}ms</div>
                <div className="text-xs text-muted-foreground">99th percentile</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Endpoint Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available for the selected time range.
                </div>
              ) : (
                performanceData.map((endpoint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{endpoint.method}</Badge>
                          <span className="font-mono text-sm">{endpoint.endpoint}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {endpoint.stats.totalRequests} requests • {endpoint.stats.cacheHitRate.toFixed(1)}% cache hit rate
                        </div>
                      </div>
                      {getPerformanceBadge(endpoint.stats.p95)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">P50</div>
                        <div className="font-semibold">{Math.round(endpoint.stats.p50)}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">P95</div>
                        <div className="font-semibold">{Math.round(endpoint.stats.p95)}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">P99</div>
                        <div className="font-semibold">{Math.round(endpoint.stats.p99)}ms</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg</div>
                        <div className="font-semibold">{Math.round(endpoint.stats.avgDuration)}ms</div>
                      </div>
                    </div>

                    {endpoint.slowQueries.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          Slowest Queries
                        </div>
                        <div className="space-y-1">
                          {endpoint.slowQueries.map((query, qIndex) => (
                            <div key={qIndex} className="flex items-center justify-between text-xs">
                              <span className="font-mono">{query.id}</span>
                              <div className="flex items-center space-x-2">
                                {query.cache_hit && <Badge variant="outline" className="h-4 text-xs">Cached</Badge>}
                                <span className="font-semibold">{query.duration_ms}ms</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}