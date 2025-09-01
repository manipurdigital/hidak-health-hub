import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Trash2, Search, Users, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  roles: { role: string }[];
}

export const AdminUsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with profiles and roles
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('Fetching users...');
      
      // First, let's try a simpler query to see if we can get profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      console.log('Profiles data:', profilesData);

      // Get user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Roles error:', rolesError);
        // Don't throw error for roles, just log it
        console.warn('Could not fetch roles, using empty array');
      }

      console.log('Roles data:', rolesData);

      // Combine the data
      const usersWithRoles = profilesData?.map(profile => ({
        ...profile,
        roles: rolesData?.filter(role => role.user_id === profile.user_id) || []
      })) || [];

      console.log('Final users with roles:', usersWithRoles);
      return usersWithRoles;
    }
  });

  console.log('Query result:', { users, isLoading, error });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'doctor' | 'lab' | 'user' }) => {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive"
      });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedUser: Partial<UserProfile>) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedUser.full_name,
          phone: updatedUser.phone
        })
        .eq('user_id', updatedUser.user_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "Success",
        description: "User profile updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user profile",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; full_name: string; phone: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: userData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      // Check if the response contains an error (edge function returned error with 200 status)
      if (data?.error) {
        console.error('Edge function returned error:', data);
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log('User created successfully:', data);
      // Force refresh the query
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      // Also refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ['admin-users'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: `User "${data.user?.full_name || data.user?.email}" created successfully`
      });
    },
    onError: (error: any) => {
      console.error('Create user error:', error);
      
      // Extract the actual error message from various possible sources
      let errorMessage = "Failed to create user";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    const matchesRole = roleFilter === 'all' || 
                       userRoles.some(r => r.role === roleFilter);
    
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    updateRoleMutation.mutate({ userId, newRole: newRole as 'admin' | 'doctor' | 'lab' | 'user' });
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleUpdateProfile = (formData: FormData) => {
    if (!editingUser) return;

    const updatedUser = {
      ...editingUser,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string
    };

    updateProfileMutation.mutate(updatedUser);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteUserMutation.mutate(deletingUser.user_id);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'doctor': return 'default';
      case 'lab': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCreateUser = (formData: FormData) => {
    const userData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string
    };

    createUserMutation.mutate(userData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('Query error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
          </Dialog>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm">Debug: Total users loaded: {users.length}</p>
          <p className="text-sm">Filtered users: {filteredUsers.length}</p>
          <p className="text-sm">Search term: "{searchTerm}"</p>
          <p className="text-sm">Role filter: {roleFilter}</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {users.length === 0 ? 'No users found in the system.' : 'No users match your current filters.'}
              </p>
              {users.length === 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Refresh Data
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.phone || 'No phone'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {Array.isArray(user.roles) && user.roles.length > 0 ? (
                          user.roles.map((role, index) => (
                            <Badge key={index} variant={getRoleBadgeColor(role.role)}>
                              {role.role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No role assigned</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={Array.isArray(user.roles) && user.roles[0]?.role || 'user'}
                        onValueChange={(value) => handleRoleChange(user.user_id, value)}
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="lab">Lab Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleUpdateProfile(formData);
          }} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={editingUser?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={editingUser?.full_name || ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={editingUser?.phone || ''}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete User Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          
          {deletingUser && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{deletingUser.full_name || 'No name'}</p>
                <p className="text-sm text-muted-foreground">{deletingUser.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {Array.isArray(deletingUser.roles) && deletingUser.roles.length > 0 ? (
                    deletingUser.roles.map((role, index) => (
                      <Badge key={index} variant={getRoleBadgeColor(role.role)}>
                        {role.role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">No role assigned</Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Create a new user account with specified role and credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleCreateUser(formData);
          }} className="space-y-4">
            <div>
              <Label htmlFor="create_email">Email *</Label>
              <Input
                id="create_email"
                name="email"
                type="email"
                required
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="create_password">Password *</Label>
              <Input
                id="create_password"
                name="password"
                type="password"
                required
                placeholder="Minimum 8 characters"
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="create_full_name">Full Name *</Label>
              <Input
                id="create_full_name"
                name="full_name"
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="create_phone">Phone</Label>
              <Input
                id="create_phone"
                name="phone"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="create_role">Role *</Label>
              <Select name="role" defaultValue="user" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="lab">Lab Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};