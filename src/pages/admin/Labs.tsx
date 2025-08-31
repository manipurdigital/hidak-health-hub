// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Plus, Edit, Percent, User, Link, KeyRound } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CenterCommissionForm } from '@/components/admin/CenterCommissionForm';
import { Textarea } from '@/components/ui/textarea';

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
  const [addOpen, setAddOpen] = useState(false);
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [commissionRate, setCommissionRate] = useState('20'); // percent
  
  // Link account form state
  const [linkEmail, setLinkEmail] = useState('');
  const [selectedCenterForLink, setSelectedCenterForLink] = useState<DiagnosticCenter | null>(null);
  
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

  // Get centers without linked accounts for the linking functionality
  const { data: centerStaff = [] } = useQuery({
    queryKey: ['center-staff-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_staff')
        .select('center_id')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    }
  });

  const unlinkedCenters = centers.filter(center => 
    !centerStaff.some(staff => staff.center_id === center.id)
  );

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

  const createCenterMutation = useMutation({
    mutationFn: async () => {
      const rate = Math.max(0, Math.min(100, parseFloat(commissionRate || '20')));
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .insert({
          name: name.trim(),
          email: email.trim(),
          contact_phone: phone.trim(),
          address: address.trim(),
          platform_commission_rate: (rate / 100),
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Center Added', description: 'Diagnostic center created successfully' });
      setAddOpen(false);
      setName(''); setEmail(''); setPhone(''); setAddress(''); setCommissionRate('20');
      queryClient.invalidateQueries({ queryKey: ['diagnostic-centers'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Create Failed', description: error.message, variant: 'destructive' });
    }
  });

  const linkAccountMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCenterForLink || !linkEmail.trim()) {
        throw new Error('Please enter user email and select a center');
      }
      const { error } = await supabase.rpc('admin_link_center_account_by_email', {
        p_center_id: selectedCenterForLink.id,
        p_email: linkEmail.trim()
      });
      if (error) {
        if (error.message === 'user_not_found') {
          throw new Error('No user found with this email address');
        }
        if (error.message === 'center_not_found') {
          throw new Error('Center not found');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Account Linked',
        description: 'User account successfully linked to diagnostic center'
      });
      setLinkAccountOpen(false);
      setLinkEmail('');
      setSelectedCenterForLink(null);
      queryClient.invalidateQueries({ queryKey: ['center-staff-relationships'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Link Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleLinkAccount = () => {
    if (!linkEmail.trim() || !selectedCenterForLink) {
      toast({
        title: 'Error',
        description: 'Please provide user email and select a center',
        variant: 'destructive'
      });
      return;
    }
    linkAccountMutation.mutate();
  };

  const handleSendPasswordReset = async (center: DiagnosticCenter) => {
    if (!center.email) {
      toast({
        title: "Error",
        description: "Contact email is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(center.email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Password reset email sent to ${center.email}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset",
        variant: "destructive"
      });
    }
  };

  const isCenterLinked = (centerId: string) => {
    return centerStaff.some(staff => staff.center_id === centerId);
  };

  if (isLoading) {
    return <div className="p-6">Loading diagnostic centers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Diagnostic Centers</h1>
        <div className="flex gap-2">
          <Dialog open={linkAccountOpen} onOpenChange={setLinkAccountOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={unlinkedCenters.length === 0}>
                <Link className="h-4 w-4 mr-2" />
                Link Existing Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Link Existing Account</DialogTitle>
                <DialogDescription>
                  Link an existing user account to a diagnostic center by their email address.
                </DialogDescription>
              </DialogHeader>
              {unlinkedCenters.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">All centers have been linked to accounts.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="link-email">User Email</Label>
                    <Input
                      id="link-email"
                      type="email"
                      value={linkEmail}
                      onChange={(e) => setLinkEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="center-select">Select Center Profile</Label>
                    <Select 
                      value={selectedCenterForLink?.id || ''} 
                      onValueChange={(value) => {
                        const center = unlinkedCenters.find(c => c.id === value);
                        setSelectedCenterForLink(center || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a diagnostic center" />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedCenters.map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.name}
                          </SelectItem>  
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setLinkAccountOpen(false);
                        setLinkEmail('');
                        setSelectedCenterForLink(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleLinkAccount}
                      disabled={!linkEmail.trim() || !selectedCenterForLink || linkAccountMutation.isPending}
                    >
                      {linkAccountMutation.isPending ? 'Linking...' : 'Link Account'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Center
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Diagnostic Center</DialogTitle>
                <DialogDescription>Fill details to create a new partner lab center.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lab name" />
                </div>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State, Pincode" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="commission">Platform Commission (%)</Label>
                  <Input id="commission" type="number" min={0} max={100} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => createCenterMutation.mutate()}
                    disabled={!name.trim() || !email.trim() || !address.trim() || createCenterMutation.isPending}
                  >
                    {createCenterMutation.isPending ? 'Saving…' : 'Save Center'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                <TableHead>Account</TableHead>
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
                    <div className="flex items-center gap-2">
                      {isCenterLinked(center.id) ? (
                        <>
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Linked
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendPasswordReset(center)}
                            className="h-6 px-2"
                          >
                            <KeyRound className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No Account
                        </Badge>
                      )}
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
                            <DialogDescription>Set the platform commission for this center.</DialogDescription>
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