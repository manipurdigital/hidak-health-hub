import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';

export default function AdminTrackingTestPage() {
  const [selectedJob, setSelectedJob] = useState<{
    type: 'lab' | 'order';
    id: string;
    token: string | null;
    status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [trackingJobs, setTrackingJobs] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchTrackingJobs = async () => {
    setIsLoading(true);
    try {
      // Fetch lab bookings with tracking tokens
      const { data: labData } = await supabase
        .from('lab_bookings')
        .select(`
          id,
          patient_name,
          status,
          tracking_token,
          tracking_token_expires_at,
          test_id
        `)
        .not('tracking_token', 'is', null);

      // Fetch orders with tracking tokens
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          tracking_token,
          tracking_token_expires_at,
          total_amount
        `)
        .not('tracking_token', 'is', null);

      const jobs = [
        ...(labData || []).map(item => ({
          type: 'lab' as const,
          id: item.id,
          name: `Lab: ${item.patient_name} - Test ID: ${item.test_id}`,
          status: item.status,
          tracking_token: item.tracking_token,
          expires_at: item.tracking_token_expires_at
        })),
        ...(orderData || []).map(item => ({
          type: 'order' as const,
          id: item.id,
          name: `Order: ${item.order_number} - ₹${item.total_amount}`,
          status: item.status,
          tracking_token: item.tracking_token,
          expires_at: item.tracking_token_expires_at
        }))
      ];

      setTrackingJobs(jobs);
    } catch (error) {
      console.error('Error fetching tracking jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tracking jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrackingLink = (job: any) => {
    if (!job.tracking_token) return null;
    const baseUrl = window.location.origin;
    return `${baseUrl}/track/${job.type}/${job.id}/${job.tracking_token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Tracking link copied to clipboard",
    });
  };

  const triggerStatusChange = async (job: any, newStatus: string) => {
    try {
      const table = job.type === 'lab' ? 'lab_bookings' : 'orders';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', job.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
      });

      // Refresh the jobs list
      fetchTrackingJobs();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  React.useEffect(() => {
    fetchTrackingJobs();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracking Token Test</h1>
          <p className="text-muted-foreground">
            Test tracking token generation, expiry, and rotation
          </p>
        </div>
        <Button onClick={fetchTrackingJobs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trackingJobs.length === 0 ? (
              <p className="text-muted-foreground">No tracking jobs found</p>
            ) : (
              trackingJobs.map((job) => (
                <div
                  key={`${job.type}-${job.id}`}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{job.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {job.status}
                      </p>
                      {job.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(job.expires_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={isExpired(job.expires_at) ? "destructive" : "default"}>
                        {isExpired(job.expires_at) ? "Expired" : "Active"}
                      </Badge>
                      <Badge variant="outline">
                        {job.type}
                      </Badge>
                    </div>
                  </div>

                  {job.tracking_token && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={generateTrackingLink(job) || ''}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(generateTrackingLink(job) || '')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(generateTrackingLink(job) || '', '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Status Change Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {job.type === 'lab' && (
                          <>
                            {job.status !== 'en_route' && (
                              <Button
                                size="sm"
                                onClick={() => triggerStatusChange(job, 'en_route')}
                              >
                                → En Route
                              </Button>
                            )}
                            {job.status === 'en_route' && (
                              <Button
                                size="sm"
                                onClick={() => triggerStatusChange(job, 'collected')}
                              >
                                → Collected
                              </Button>
                            )}
                          </>
                        )}

                        {job.type === 'order' && (
                          <>
                            {job.status !== 'out_for_delivery' && (
                              <Button
                                size="sm"
                                onClick={() => triggerStatusChange(job, 'out_for_delivery')}
                              >
                                → Out for Delivery
                              </Button>
                            )}
                            {job.status === 'out_for_delivery' && (
                              <Button
                                size="sm"
                                onClick={() => triggerStatusChange(job, 'delivered')}
                              >
                                → Delivered
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Token Generation</h4>
              <p className="text-sm text-muted-foreground">
                Tracking tokens are automatically generated when status changes to:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Lab bookings: <code>en_route</code></li>
                <li>Orders: <code>out_for_delivery</code></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">2. Token Expiry</h4>
              <p className="text-sm text-muted-foreground">
                Tokens expire 24 hours after generation. Expired tokens return 404.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">3. Token Rotation</h4>
              <p className="text-sm text-muted-foreground">
                Tokens are nullified when status changes to:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Lab bookings: <code>collected</code></li>
                <li>Orders: <code>delivered</code></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">4. PII Protection</h4>
              <p className="text-sm text-muted-foreground">
                Public tracking pages show masked patient names and no sensitive data.
              </p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Security Note:</strong> All tracking links use 32-byte random tokens 
                and automatically expire for security.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}