
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DollarSign, Plus, CheckCircle, Clock, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function AdminLabPayoutsPage() {
  const [selectedCenter, setSelectedCenter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch diagnostic centers
  const { data: centers = [] } = useQuery({
    queryKey: ['diagnostic-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch payout batches
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['admin-lab-payout-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_payout_batches')
        .select(`
          id,
          center_id,
          status,
          total_amount,
          created_at,
          paid_at,
          reference,
          notes,
          diagnostic_centers(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Create payout batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCenter || !startDate || !endDate) {
        throw new Error('Please select center and date range');
      }

      const { data, error } = await supabase.rpc('admin_create_lab_payout_batch', {
        p_center_id: selectedCenter,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payout Batch Created",
        description: "Payout batch has been created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-payout-batches'] });
      setSelectedCenter('');
      setStartDate('');
      setEndDate('');
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Batch",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark batch as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async ({ batchId, reference, notes }: { batchId: string; reference: string; notes: string }) => {
      const { error } = await supabase.rpc('admin_mark_lab_payout_paid', {
        p_batch_id: batchId,
        p_reference: reference || null,
        p_notes: notes || null
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Payout Marked as Paid",
        description: "Payout has been marked as paid successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-payout-batches'] });
      setSelectedBatch(null);
      setPaymentReference('');
      setPaymentNotes('');
    },
    onError: (error) => {
      toast({
        title: "Failed to Mark as Paid",
        description: error.message,
        variant: "destructive"
      });
    }
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lab Payout Management</h1>
      </div>

      {/* Create New Payout Batch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Payout Batch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="center">Diagnostic Center</Label>
              <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select center" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={() => createBatchMutation.mutate()}
            disabled={createBatchMutation.isPending || !selectedCenter || !startDate || !endDate}
          >
            {createBatchMutation.isPending ? 'Creating...' : 'Create Payout Batch'}
          </Button>
        </CardContent>
      </Card>

      {/* Payout Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading payout batches...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-sm">
                      #{batch.id.slice(-8)}
                    </TableCell>
                    <TableCell>{batch.diagnostic_centers?.name}</TableCell>
                    <TableCell>{getBatchStatusBadge(batch.status)}</TableCell>
                    <TableCell className="font-semibold">₹{batch.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(batch.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {batch.paid_at ? new Date(batch.paid_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {batch.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedBatch(batch)}
                            >
                              Mark as Paid
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mark Payout as Paid</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Batch: #{batch.id.slice(-8)} • Amount: ₹{batch.total_amount.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Center: {batch.diagnostic_centers?.name}
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="reference">Payment Reference</Label>
                                <Input
                                  id="reference"
                                  placeholder="Transaction ID, check number, etc."
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Additional notes about this payment"
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => markPaidMutation.mutate({
                                    batchId: batch.id,
                                    reference: paymentReference,
                                    notes: paymentNotes
                                  })}
                                  disabled={markPaidMutation.isPending}
                                >
                                  {markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBatch(null);
                                    setPaymentReference('');
                                    setPaymentNotes('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {batch.status === 'paid' && (
                        <div className="text-sm text-muted-foreground">
                          {batch.reference && (
                            <div>Ref: {batch.reference}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
