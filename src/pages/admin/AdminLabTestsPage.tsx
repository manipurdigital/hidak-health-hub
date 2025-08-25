import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { BulkUpload } from '@/components/BulkUpload';
import { 
  User, 
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  ClipboardList
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface LabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sample_type: string;
  reporting_time: string;
  preparation_required: boolean;
  is_active: boolean;
}

const AdminLabTestsPage = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLabTest, setEditingLabTest] = useState<LabTest | null>(null);
  const [selectedLabTests, setSelectedLabTests] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Check if user is admin
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setLabTests(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lab tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddLabTest = async (formData: FormData) => {
    try {
      const labTestData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        sample_type: formData.get('sample_type') as string,
        reporting_time: formData.get('reporting_time') as string,
        preparation_required: formData.get('preparation_required') === 'true',
        is_active: true
      };

      const { error } = await supabase
        .from('lab_tests')
        .insert(labTestData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lab test added successfully"
      });

      setIsAddDialogOpen(false);
      fetchLabTests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lab test",
        variant: "destructive"
      });
    }
  };

  const handleEditLabTest = async (formData: FormData) => {
    if (!editingLabTest) return;

    try {
      const labTestData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        sample_type: formData.get('sample_type') as string,
        reporting_time: formData.get('reporting_time') as string,
        preparation_required: formData.get('preparation_required') === 'true',
        is_active: formData.get('is_active') === 'true'
      };

      const { error } = await supabase
        .from('lab_tests')
        .update(labTestData)
        .eq('id', editingLabTest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lab test updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingLabTest(null);
      fetchLabTests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lab test",
        variant: "destructive"
      });
    }
  };

  const handleBulkStatusUpdate = async (status: boolean) => {
    if (selectedLabTests.size === 0) {
      toast({
        title: "Error",
        description: "Please select lab tests to update",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to ${status ? 'activate' : 'deactivate'} ${selectedLabTests.size} lab test(s)?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('lab_tests')
        .update({ is_active: status })
        .in('id', Array.from(selectedLabTests));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedLabTests.size} lab test(s) ${status ? 'activated' : 'deactivated'} successfully`
      });

      setSelectedLabTests(new Set());
      fetchLabTests();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${status ? 'activate' : 'deactivate'} lab tests`,
        variant: "destructive"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedLabTests.size === filteredLabTests.length) {
      setSelectedLabTests(new Set());
    } else {
      setSelectedLabTests(new Set(filteredLabTests.map(t => t.id)));
    }
  };

  const handleSelectLabTest = (labTestId: string) => {
    const newSelected = new Set(selectedLabTests);
    if (newSelected.has(labTestId)) {
      newSelected.delete(labTestId);
    } else {
      newSelected.add(labTestId);
    }
    setSelectedLabTests(newSelected);
  };

  const handleDeleteLabTest = async (labTestId: string) => {
    if (!confirm('Are you sure you want to delete this lab test?')) return;

    try {
      const { error } = await supabase
        .from('lab_tests')
        .delete()
        .eq('id', labTestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lab test deleted successfully"
      });

      fetchLabTests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lab test",
        variant: "destructive"
      });
    }
  };

  const filteredLabTests = labTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-primary text-primary-foreground border-b flex items-center px-4">
          <SidebarTrigger className="mr-4" />
          
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Lab Tests Management</h1>
                <p className="text-primary-foreground/80 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="capitalize bg-yellow-100 text-yellow-800">
                {userRole}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSignOut}
                className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <AdminSidebar />

        <main className="flex-1 pt-16 p-6 bg-background">
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ClipboardList className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Lab Tests</h2>
                  <p className="text-muted-foreground">Manage available diagnostic tests</p>
                </div>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lab Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Lab Test</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddLabTest(formData);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Test Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="sample_type">Sample Type</Label>
                        <Input id="sample_type" name="sample_type" placeholder="e.g., Blood, Urine" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reporting_time">Reporting Time</Label>
                        <Input id="reporting_time" name="reporting_time" placeholder="e.g., 24 hours" />
                      </div>
                      <div>
                        <Label htmlFor="preparation_required">Preparation Required</Label>
                        <select id="preparation_required" name="preparation_required" className="w-full p-2 border rounded">
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={3} />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Add Lab Test</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <BulkUpload 
                type="lab-tests" 
                onUploadComplete={fetchLabTests}
              />
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lab tests by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lab Tests Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>All Lab Tests ({filteredLabTests.length})</CardTitle>
                {selectedLabTests.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedLabTests.size} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate(true)}
                      disabled={bulkActionLoading}
                    >
                      Activate Selected
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate(false)}
                      disabled={bulkActionLoading}
                    >
                      Deactivate Selected
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 text-sm font-medium text-muted-foreground w-12">
                            <input
                              type="checkbox"
                              checked={filteredLabTests.length > 0 && selectedLabTests.size === filteredLabTests.length}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300"
                            />
                          </th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Test Name</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Category</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Price</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Sample Type</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Reporting Time</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Preparation</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLabTests.map((test) => (
                          <tr key={test.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-4">
                              <input
                                type="checkbox"
                                checked={selectedLabTests.has(test.id)}
                                onChange={() => handleSelectLabTest(test.id)}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="py-4 font-medium">{test.name}</td>
                            <td className="py-4 text-muted-foreground">{test.category || 'N/A'}</td>
                            <td className="py-4">₹{test.price}</td>
                            <td className="py-4">{test.sample_type || 'N/A'}</td>
                            <td className="py-4">{test.reporting_time || 'N/A'}</td>
                            <td className="py-4">
                              <Badge variant={test.preparation_required ? "secondary" : "outline"}>
                                {test.preparation_required ? "Required" : "Not Required"}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Badge variant={test.is_active ? "default" : "secondary"}>
                                {test.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingLabTest(test);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteLabTest(test.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Edit Lab Test Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lab Test</DialogTitle>
          </DialogHeader>
          {editingLabTest && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditLabTest(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Test Name</Label>
                  <Input id="edit_name" name="name" defaultValue={editingLabTest.name} required />
                </div>
                <div>
                  <Label htmlFor="edit_category">Category</Label>
                  <Input id="edit_category" name="category" defaultValue={editingLabTest.category || ''} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_price">Price</Label>
                  <Input id="edit_price" name="price" type="number" step="0.01" defaultValue={editingLabTest.price} required />
                </div>
                <div>
                  <Label htmlFor="edit_sample_type">Sample Type</Label>
                  <Input id="edit_sample_type" name="sample_type" defaultValue={editingLabTest.sample_type || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_reporting_time">Reporting Time</Label>
                  <Input id="edit_reporting_time" name="reporting_time" defaultValue={editingLabTest.reporting_time || ''} />
                </div>
                <div>
                  <Label htmlFor="edit_preparation_required">Preparation Required</Label>
                  <select id="edit_preparation_required" name="preparation_required" className="w-full p-2 border rounded" defaultValue={editingLabTest.preparation_required.toString()}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea id="edit_description" name="description" rows={3} defaultValue={editingLabTest.description || ''} />
              </div>
              <div>
                <Label htmlFor="edit_is_active">Status</Label>
                <select id="edit_is_active" name="is_active" className="w-full p-2 border rounded" defaultValue={editingLabTest.is_active.toString()}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminLabTestsPage;