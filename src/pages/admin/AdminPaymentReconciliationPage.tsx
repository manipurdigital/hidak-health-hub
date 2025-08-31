// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, RefreshCw, AlertTriangle, CheckCircle, Clock, X, Search } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentEvent {
  id: string;
  payload: any;
  received_at: string;
  processed_at: string | null;
  signature_valid: boolean;
  outcome: string | null;
  error_details: any;
  correlation_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
}

interface ReconciliationStats {
  total_events: number;
  processed_events: number;
  failed_events: number;
  pending_events: number;
  duplicate_events: number;
  success_rate: number;
}

export default function AdminPaymentReconciliationPage() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Fetch reconciliation stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['payment-reconciliation-stats', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_payment_reconciliation_stats', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      if (error) throw error;
      return data?.[0] as ReconciliationStats;
    }
  });

  // Fetch payment events
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['payment-events', dateRange, search, outcomeFilter],
    queryFn: async () => {
      let query = supabase
        .from('payment_events')
        .select('*')
        .gte('received_at', dateRange.start + 'T00:00:00Z')
        .lte('received_at', dateRange.end + 'T23:59:59Z')
        .order('received_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`id.ilike.%${search}%,entity_id.ilike.%${search}%,correlation_id.ilike.%${search}%`);
      }

      if (outcomeFilter !== 'all') {
        if (outcomeFilter === 'pending') {
          query = query.is('processed_at', null);
        } else {
          query = query.eq('outcome', outcomeFilter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentEvent[];
    }
  });

  const refreshData = () => {
    refetchStats();
    refetchEvents();
  };

  const getOutcomeBadge = (event: PaymentEvent) => {
    if (!event.processed_at) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }

    switch (event.outcome) {
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'ignored':
        return <Badge variant="outline">Ignored</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getSignatureBadge = (isValid: boolean) => {
    return isValid ? (
      <Badge variant="default" className="bg-green-500">Valid</Badge>
    ) : (
      <Badge variant="destructive">Invalid</Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
          <p className="text-muted-foreground">
            Monitor webhook events and payment processing integrity
          </p>
        </div>
        <Button onClick={refreshData} disabled={statsLoading || eventsLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(statsLoading || eventsLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Event ID, Entity ID, or Correlation ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="outcome">Outcome</Label>
              <select
                id="outcome"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="w-full h-10 px-3 border border-input bg-background rounded-md"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="error">Error</option>
                <option value="ignored">Ignored</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_events}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.processed_events}</div>
              <p className="text-sm text-muted-foreground">Processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.failed_events}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_events}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.duplicate_events}</div>
              <p className="text-sm text-muted-foreground">Duplicates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.success_rate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Correlation ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events?.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs">
                        {event.id.length > 20 ? `${event.id.substring(0, 20)}...` : event.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.event_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary">{event.entity_type}</Badge>
                          <div className="text-xs text-muted-foreground font-mono">
                            {event.entity_id?.length > 15 ? 
                              `${event.entity_id.substring(0, 15)}...` : 
                              event.entity_id
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getSignatureBadge(event.signature_valid)}</TableCell>
                      <TableCell>{getOutcomeBadge(event)}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(event.received_at), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {event.processed_at ? 
                          format(new Date(event.processed_at), 'MMM dd, HH:mm:ss') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.correlation_id.substring(0, 8)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {events?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No payment events found for the selected criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Idempotency & Security Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Webhook Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Signature verification using HMAC-SHA256</li>
                <li>✅ Event deduplication by event ID</li>
                <li>✅ Correlation IDs for request tracing</li>
                <li>✅ Structured error logging</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">State Integrity</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Atomic payment status updates</li>
                <li>✅ No double-processing of payments</li>
                <li>✅ Complete audit trail</li>
                <li>✅ Failed event tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}