import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from '@/components/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Lab Test
              </Button>
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
              <CardHeader>
                <CardTitle>All Lab Tests ({filteredLabTests.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
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
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm">
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
    </SidebarProvider>
  );
};

export default AdminLabTestsPage;