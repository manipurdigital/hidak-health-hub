import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminLinkCenterAccount } from '@/hooks/center-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Link2, Users, Building2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata: any;
}

interface DiagnosticCenter {
  id: string;
  name: string;
  email: string;
  contact_phone: string;
  address: string;
  is_active: boolean;
}

interface CenterStaff {
  id: string;
  user_id: string;
  center_id: string;
  role: string;
  is_active: boolean;
  diagnostic_centers: {
    id: string;
    name: string;
    email: string;
    contact_phone: string;
    address: string;
    is_active: boolean;
  };
  profiles: {
    email: string;
    full_name: string;
  } | null;
}

export function CenterAccountLinking() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedRole, setSelectedRole] = useState('center');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const linkCenterAccount = useAdminLinkCenterAccount();

  // Fetch all users
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      return data.users as User[];
    },
  });

  // Fetch diagnostic centers
  const { data: centers } = useQuery({
    queryKey: ['diagnostic-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as DiagnosticCenter[];
    },
  });

  // Fetch center staff relationships
  const { data: centerStaff } = useQuery({
    queryKey: ['center-staff-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('center_staff')
        .select(`
          *,
          diagnostic_centers(id, name, email, contact_phone, address, is_active)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredUsers = users?.filter(user => 
    !searchEmail || user.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const handleLinkAccount = async () => {
    if (!selectedUser || !selectedCenter) return;

    await linkCenterAccount.mutateAsync({
      userId: selectedUser.id,
      centerId: selectedCenter,
      role: selectedRole
    });

    setIsDialogOpen(false);
    setSelectedUser(null);
    setSelectedCenter('');
    setSelectedRole('center');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Center Account Management</h2>
          <p className="text-muted-foreground">Link user accounts to diagnostic centers</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Link2 className="h-4 w-4 mr-2" />
              Link Center Account
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Link User to Center</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* User Selection */}
              <div className="space-y-4">
                <Label>Search & Select User</Label>
                <div className="flex gap-2">
                  <Search className="h-4 w-4 text-muted-foreground mt-3" />
                  <Input
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
                
                <div className="max-h-40 overflow-y-auto border rounded">
                  {filteredUsers?.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedUser?.id === user.id ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <p className="font-medium">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}... • Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Selection */}
              <div className="space-y-2">
                <Label htmlFor="center">Select Center</Label>
                <Select value={selectedCenter} onValueChange={setSelectedCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a diagnostic center" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers?.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {center.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center Admin</SelectItem>
                    <SelectItem value="center_staff">Center Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLinkAccount}
                  disabled={!selectedUser || !selectedCenter || linkCenterAccount.isPending}
                >
                  {linkCenterAccount.isPending ? 'Linking...' : 'Link Account'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Center Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Linked Center Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!centerStaff || centerStaff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No center accounts linked yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Center</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centerStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">User ID: {staff.user_id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">Center staff member</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{staff.diagnostic_centers.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.diagnostic_centers.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.role === 'admin' ? 'default' : 'secondary'}>
                        {staff.role === 'admin' ? 'Center Admin' : 'Staff'}
                      </Badge>
                    </TableCell>
                    <TableCell>{staff.diagnostic_centers.contact_phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </Badge>
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
