
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DollarSign, Calendar, ChevronDown, ChevronRight, Clock, CheckCircle } from 'lucide-react';

export function CenterPaymentsPage() {
  // Fetch pending payout amount (collected bookings not yet in any payout batch)
  const { data: pendingPayout = 0 } = useQuery({
    queryKey: ['center-pending-payout'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_bookings')
        .select('center_payout_amount')
        .eq('status', 'collected')
        .is('center_payout_amount', null)
        .not('center_payout_amount', 'is', null);

      if (error) throw error;
      
      // Also check bookings not in any payout items
      const { data: notInPayoutItems, error: error2 } = await supabase
        .from('lab_bookings')
        .select('center_payout_amount')
        .eq('status', 'collected')
        .not('id', 'in', `(SELECT booking_id FROM lab_payout_items WHERE booking_id IS NOT NULL)`);

      if (error2) throw error2;

      return notInPayoutItems?.reduce((sum, booking) => 
        sum + (booking.center_payout_amount || 0), 0) || 0;
    }
  });

  // Fetch payout batches for this center
  const { data: payoutBatches = [], isLoading } = useQuery({
    queryKey: ['center-payout-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_payout_batches')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          paid_at,
          reference,
          notes
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch payout items for expanded batches
  const fetchPayoutItems = async (batchId: string) => {
    const { data, error } = await supabase
      .from('lab_payout_items')
      .select(`
        id,
        amount,
        created_at,
        lab_bookings (
          id,
          patient_name,
          booking_date,
          total_amount
        )
      `)
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  };

  const getBatchStatusBadge = (status: string) => {
    return status === 'paid' ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading payment information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Payment Tracking</h1>
        <p className="text-muted-foreground">
          Track your lab collection payments and payout history
        </p>
      </div>

      {/* Pending Payout Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pending Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₹{pendingPayout.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            From completed collections not yet processed for payout
          </p>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutBatches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payout batches yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutBatches.map((batch: any) => (
                <PayoutBatchCard key={batch.id} batch={batch} fetchItems={fetchPayoutItems} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutBatchCard({ batch, fetchItems }: { batch: any; fetchItems: (batchId: string) => Promise<any[]> }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['payout-items', batch.id],
    queryFn: () => fetchItems(batch.id),
    enabled: isOpen
  });

  const getBatchStatusBadge = (status: string) => {
    return status === 'paid' ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div>
                  <div className="font-medium">
                    Payout Batch #{batch.id.slice(-8)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(batch.created_at).toLocaleDateString()}
                    {batch.paid_at && ` • Paid: ${new Date(batch.paid_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold">₹{batch.total_amount.toFixed(2)}</div>
                  {batch.reference && (
                    <div className="text-sm text-muted-foreground">Ref: {batch.reference}</div>
                  )}
                </div>
                {getBatchStatusBadge(batch.status)}
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2 ml-6">
          <CardContent className="p-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading items...</p>
            ) : (
              <>
                {batch.notes && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{batch.notes}</p>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>Booking Amount</TableHead>
                      <TableHead>Payout Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.lab_bookings?.patient_name}</TableCell>
                        <TableCell>
                          {item.lab_bookings?.booking_date ? 
                            new Date(item.lab_bookings.booking_date).toLocaleDateString() : 
                            'N/A'}
                        </TableCell>
                        <TableCell>₹{item.lab_bookings?.total_amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="font-medium">₹{item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
