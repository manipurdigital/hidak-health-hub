
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Plus, Edit, Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CenterCommissionForm } from '@/components/admin/CenterCommissionForm';

interface DiagnosticCenter {
  id: string;
  name: string;
  email: string;
  contact_phone: string;
  address: string;
  is_active: boolean;
  platform_commission_rate: number;
  created_at: string;
}

export default function Labs() {
  const [selectedCenter, setSelectedCenter] = useState<DiagnosticCenter | null>(null);
  const queryClient = useQueryClient();

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['diagnostic-centers'],
    queryFn: async (): Promise<DiagnosticCenter[]> => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('diagnostic_centers')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Center status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['diagnostic-centers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return <div className="p-6">Loading diagnostic centers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Diagnostic Centers</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Center
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Centers Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Commission Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centers.map((center) => (
                <TableRow key={center.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{center.name}</div>
                      <div className="text-sm text-muted-foreground">{center.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{center.email}</div>
                      <div className="text-sm text-muted-foreground">{center.contact_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      <span className="font-medium">
                        {Math.round((center.platform_commission_rate || 0.20) * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Partner: {Math.round((1 - (center.platform_commission_rate || 0.20)) * 100)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={center.is_active ? "default" : "secondary"}>
                      {center.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCenter(center)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Commission
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Update Commission Rate</DialogTitle>
                          </DialogHeader>
                          {selectedCenter && (
                            <CenterCommissionForm
                              centerId={selectedCenter.id}
                              centerName={selectedCenter.name}
                              currentRate={selectedCenter.platform_commission_rate || 0.20}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(center.id, center.is_active)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {center.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
