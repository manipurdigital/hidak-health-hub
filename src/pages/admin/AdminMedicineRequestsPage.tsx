import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMedicineRequests, useUpdateMedicineRequest, type MedicineRequest } from '@/hooks/medicine-request-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { MessageCircle, Phone, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { AdminLayoutWrapper } from '@/components/AdminLayoutWrapper';

const updateRequestSchema = z.object({
  status: z.enum(['pending', 'contacted', 'confirmed', 'rejected', 'completed']),
  admin_notes: z.string().optional(),
  estimated_price: z.number().optional(),
  substitutes_available: z.boolean().optional(),
});

type UpdateRequestForm = z.infer<typeof updateRequestSchema>;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  pending: Clock,
  contacted: Phone,
  confirmed: CheckCircle,
  rejected: XCircle,
  completed: CheckCircle,
};

export const AdminMedicineRequestsPage = () => {
  const { data: requests = [], isLoading } = useMedicineRequests();
  const updateRequest = useUpdateMedicineRequest();
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const form = useForm<UpdateRequestForm>({
    resolver: zodResolver(updateRequestSchema),
  });

  const handleUpdateRequest = async (data: UpdateRequestForm) => {
    if (!selectedRequest) return;
    
    const updates: any = {
      status: data.status,
      admin_notes: data.admin_notes || null,
    };

    if (data.estimated_price) {
      updates.estimated_price = data.estimated_price;
    }
    
    if (data.substitutes_available !== undefined) {
      updates.substitutes_available = data.substitutes_available;
    }

    if (data.status === 'contacted' && selectedRequest.status !== 'contacted') {
      updates.contacted_at = new Date().toISOString();
    }
    
    if (data.status === 'completed' && selectedRequest.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    await updateRequest.mutateAsync({ id: selectedRequest.id, updates });
    setIsUpdateDialogOpen(false);
    setSelectedRequest(null);
    form.reset();
  };

  const openUpdateDialog = (request: MedicineRequest) => {
    setSelectedRequest(request);
    form.reset({
      status: request.status,
      admin_notes: request.admin_notes || '',
      estimated_price: request.estimated_price || undefined,
      substitutes_available: request.substitutes_available || false,
    });
    setIsUpdateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayoutWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading medicine requests...</div>
        </div>
      </AdminLayoutWrapper>
    );
  }

  return (
    <AdminLayoutWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Medicine Requests</h1>
          <p className="text-muted-foreground">
            Manage customer medicine requests and confirm availability
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              All Medicine Requests ({requests.length})
            </CardTitle>
            <CardDescription>
              Customer requests for medicines not available in the current inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No medicine requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((request) => {
                      const StatusIcon = statusIcons[request.status];
                      return (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.customer_name}
                          </TableCell>
                          <TableCell>
                            <a href={`tel:${request.customer_phone}`} className="flex items-center gap-2 hover:text-primary">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {request.customer_phone}
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={request.medicine_names}>
                              {request.medicine_names}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {request.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUpdateDialog(request)}
                              className="flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Medicine Request</DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div><strong>Customer:</strong> {selectedRequest.customer_name}</div>
                  <div><strong>Phone:</strong> {selectedRequest.customer_phone}</div>
                  <div><strong>Medicines:</strong></div>
                  <div className="whitespace-pre-wrap text-sm bg-background p-2 rounded border">
                    {selectedRequest.medicine_names}
                  </div>
                  {selectedRequest.notes && (
                    <div>
                      <strong>Notes:</strong>
                      <div className="text-sm mt-1">{selectedRequest.notes}</div>
                    </div>
                  )}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdateRequest)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimated_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Price (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter estimated price"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="substitutes_available"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Substitutes Available</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select availability" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="admin_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add internal notes about this request"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUpdateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateRequest.isPending}
                        className="flex-1"
                      >
                        {updateRequest.isPending ? 'Updating...' : 'Update Request'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayoutWrapper>
  );
};