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
  Package
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface Medicine {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  is_active: boolean;
  category_id: string;
}

const AdminMedicinesPage = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin
  if (userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch medicines",
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

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.brand?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-lg font-bold">Medicines Management</h1>
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
                <Package className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">Medicines</h2>
                  <p className="text-muted-foreground">Manage your medicine inventory</p>
                </div>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicines by name or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medicines Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Medicines ({filteredMedicines.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Medicine</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Brand</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Price</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Stock</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Prescription</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMedicines.map((medicine) => (
                          <tr key={medicine.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-4 font-medium">{medicine.name}</td>
                            <td className="py-4 text-muted-foreground">{medicine.brand || 'N/A'}</td>
                            <td className="py-4">₹{medicine.price}</td>
                            <td className="py-4">
                              <Badge variant={medicine.stock_quantity > 10 ? "default" : "destructive"}>
                                {medicine.stock_quantity}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Badge variant={medicine.requires_prescription ? "secondary" : "outline"}>
                                {medicine.requires_prescription ? "Required" : "OTC"}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Badge variant={medicine.is_active ? "default" : "secondary"}>
                                {medicine.is_active ? "Active" : "Inactive"}
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

export default AdminMedicinesPage;