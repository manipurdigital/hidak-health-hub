import { useState } from 'react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Database, Truck, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminDeliveryPlaygroundPage() {
  const [orderNumber, setOrderNumber] = useState('ORD-XXXX');
  const [orderId, setOrderId] = useState('<order_id>');
  const [riderCode, setRiderCode] = useState('RID-001');
  const { toast } = useToast();

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${description} SQL copied`,
    });
  };

  return (
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Delivery Assignment Playground</h1>
            <p className="text-muted-foreground">
              Test and seed delivery assignment functionality
            </p>
          </div>
        </div>

        {/* Seed Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Seed Test Data
            </CardTitle>
            <CardDescription>
              Create test rider and sample data for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Seed Test Rider</Label>
              <div className="flex gap-2">
                <Textarea
                  readOnly
                  value={`insert into public.riders (code, full_name, phone, vehicle_type, is_active)
values ('RID-001','Test Rider','9999999999','bike',true)
on conflict (code) do update set is_active = true;`}
                  className="font-mono text-sm"
                  rows={3}
                />
                <Button
                  onClick={() => copyToClipboard(
                    `insert into public.riders (code, full_name, phone, vehicle_type, is_active) values ('RID-001','Test Rider','9999999999','bike',true) on conflict (code) do update set is_active = true;`,
                    "Seed Rider"
                  )}
                  className="min-w-[100px]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Flow Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Flow Testing</CardTitle>
            <CardDescription>
              Test the complete delivery assignment workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order-number">Order Number</Label>
                <Input
                  id="order-number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rider-code">Rider Code</Label>
                <Input
                  id="rider-code"
                  value={riderCode}
                  onChange={(e) => setRiderCode(e.target.value)}
                  placeholder="RID-001"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Step 1: Assign Rider</Label>
                <div className="flex gap-2">
                  <Textarea
                    readOnly
                    value={`select public.admin_assign_rider('${orderNumber}','${riderCode}');`}
                    className="font-mono text-sm"
                    rows={1}
                  />
                  <Button
                    onClick={() => copyToClipboard(
                      `select public.admin_assign_rider('${orderNumber}','${riderCode}');`,
                      "Assign Rider"
                    )}
                    className="min-w-[100px]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Creates/updates assignment with status 'pending'
                </p>
              </div>

              <div className="space-y-2">
                <Label>Step 2: Set On The Way</Label>
                <div className="flex gap-2">
                  <Textarea
                    readOnly
                    value={`select public.admin_set_delivery_status('${orderNumber}','on_the_way');`}
                    className="font-mono text-sm"
                    rows={1}
                  />
                  <Button
                    onClick={() => copyToClipboard(
                      `select public.admin_set_delivery_status('${orderNumber}','on_the_way');`,
                      "Set On The Way"
                    )}
                    className="min-w-[100px]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Auto-fills picked_up_at timestamp
                </p>
              </div>

              <div className="space-y-2">
                <Label>Step 3: Set Delivered</Label>
                <div className="flex gap-2">
                  <Textarea
                    readOnly
                    value={`select public.admin_set_delivery_status('${orderNumber}','delivered');`}
                    className="font-mono text-sm"
                    rows={1}
                  />
                  <Button
                    onClick={() => copyToClipboard(
                      `select public.admin_set_delivery_status('${orderNumber}','delivered');`,
                      "Set Delivered"
                    )}
                    className="min-w-[100px]"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Auto-fills delivered_at timestamp
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Flow Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Rider Flow Testing</CardTitle>
            <CardDescription>
              Test rider functions (requires rider role authentication)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* By Order ID */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order-id">Order ID (UUID)</Label>
                  <Input
                    id="order-id"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="<order_id>"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Step 1: Start Trip (by Order ID)</Label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={`select public.rider_start('${orderId}');`}
                        className="font-mono text-sm"
                        rows={1}
                      />
                      <Button
                        onClick={() => copyToClipboard(
                          `select public.rider_start('${orderId}');`,
                          "Rider Start"
                        )}
                        className="min-w-[100px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sets status to "on_the_way" and updates picked_up_at
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Step 2: Complete Delivery (by Order ID)</Label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={`select public.rider_complete('${orderId}');`}
                        className="font-mono text-sm"
                        rows={1}
                      />
                      <Button
                        onClick={() => copyToClipboard(
                          `select public.rider_complete('${orderId}');`,
                          "Rider Complete"
                        )}
                        className="min-w-[100px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sets status to "delivered" and updates delivered_at
                    </p>
                  </div>
                </div>
              </div>

              {/* By Assignment ID */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Alternative: Using Assignment ID</Label>
                  <p className="text-sm text-muted-foreground">
                    Rider can also use the delivery assignment ID (easier from the assignments table)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Get Assignment ID for Order</Label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={`-- Get assignment ID for order number\nwith a as (\n  select da.id\n  from public.orders o\n  join public.delivery_assignments da on da.order_id = o.id\n  where o.order_number = '${orderNumber}'\n  limit 1\n)\nselect id from a;`}
                        className="font-mono text-sm"
                        rows={8}
                      />
                      <Button
                        onClick={() => copyToClipboard(
                          `-- Get assignment ID for order number\nwith a as (\n  select da.id\n  from public.orders o\n  join public.delivery_assignments da on da.order_id = o.id\n  where o.order_number = '${orderNumber}'\n  limit 1\n)\nselect id from a;`,
                          "Get Assignment ID"
                        )}
                        className="min-w-[100px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Trip (by Assignment ID)</Label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={`select public.rider_start_by_assignment('<assignment_id>');`}
                        className="font-mono text-sm"
                        rows={1}
                      />
                      <Button
                        onClick={() => copyToClipboard(
                          `select public.rider_start_by_assignment('<assignment_id>');`,
                          "Rider Start by Assignment"
                        )}
                        className="min-w-[100px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Complete Delivery (by Assignment ID)</Label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={`select public.rider_complete_by_assignment('<assignment_id>');`}
                        className="font-mono text-sm"
                        rows={1}
                      />
                      <Button
                        onClick={() => copyToClipboard(
                          `select public.rider_complete_by_assignment('<assignment_id>');`,
                          "Rider Complete by Assignment"
                        )}
                        className="min-w-[100px]"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>
              Copy the SQL snippets and run them in the Supabase SQL editor or PostgreSQL console
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              1. First, seed the test rider using the SQL above
            </p>
            <p className="text-sm text-muted-foreground">
              2. Make sure you have a valid order with the order number you're testing
            </p>
            <p className="text-sm text-muted-foreground">
              3. Run each SQL snippet in sequence to test the complete delivery flow
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}