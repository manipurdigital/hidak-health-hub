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
import { URLImportDialog } from '@/components/URLImportDialog';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { 
  User, 
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Link,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ThumbnailUrlProcessor } from '@/components/ThumbnailUrlProcessor';

// Helper functions to compute composition keys
const normalizeComposition = (composition: string): string => {
  return composition
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\+\-\(\)\[\]\.]/g, '')
    .trim();
};

const generateCompositionKey = (composition: string): string => {
  if (!composition?.trim()) return '';
  
  const normalized = normalizeComposition(composition);
  const ingredients = normalized
    .split(/\+|,|\band\b/)
    .map(ingredient => ingredient.trim().replace(/\s*\d+\.?\d*\s*(mg|g|ml|mcg|iu|%)\s*/g, ''))
    .filter(ingredient => ingredient.length > 0)
    .sort();
  
  return ingredients.join('+');
};

const generateCompositionFamilyKey = (composition: string): string => {
  if (!composition?.trim()) return '';
  
  const normalized = normalizeComposition(composition);
  const activeIngredients = normalized
    .split(/\+|,|\band\b/)
    .map(ingredient => {
      const cleaned = ingredient.trim();
      const match = cleaned.match(/^([a-zA-Z\s\-]+)/);
      return match ? match[1].trim() : cleaned;
    })
    .filter(ingredient => ingredient.length > 2)
    .sort();
  
  return activeIngredients.join('+');
};

interface Medicine {
  id: string;
  name: string;
  brand?: string;
  composition_text?: string;
  composition_key?: string;
  composition_family_key?: string;
  price: number;
  original_price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  is_active: boolean;
  category_id: string;
  description: string;
  manufacturer: string;
  dosage: string;
  pack_size: string;
  image_url?: string;
  external_source_url?: string;
  external_source_domain?: string;
  source_last_fetched?: string;
}

const AdminMedicinesPage = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [refetchingMedicines, setRefetchingMedicines] = useState<Set<string>>(new Set());

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

  const handleAddMedicine = async (formData: FormData) => {
    try {
      const compositionText = formData.get('composition_text') as string;
      const medicineData = {
        name: formData.get('name') as string,
        composition_text: compositionText,
        composition_key: generateCompositionKey(compositionText),
        composition_family_key: generateCompositionFamilyKey(compositionText),
        price: parseFloat(formData.get('price') as string),
        original_price: parseFloat(formData.get('original_price') as string),
        stock_quantity: parseInt(formData.get('stock_quantity') as string),
        requires_prescription: formData.get('requires_prescription') === 'true',
        description: formData.get('description') as string,
        manufacturer: formData.get('manufacturer') as string,
        dosage: formData.get('dosage') as string,
        pack_size: formData.get('pack_size') as string,
        image_url: formData.get('image_url') as string || null,
        is_active: true
      };

      const { error } = await supabase
        .from('medicines')
        .insert(medicineData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine added successfully"
      });

      setIsAddDialogOpen(false);
      fetchMedicines();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add medicine",
        variant: "destructive"
      });
    }
  };

  const handleEditMedicine = async (formData: FormData) => {
    if (!editingMedicine) return;

    try {
      const compositionText = formData.get('composition_text') as string;
      const medicineData = {
        name: formData.get('name') as string,
        composition_text: compositionText,
        composition_key: generateCompositionKey(compositionText),
        composition_family_key: generateCompositionFamilyKey(compositionText),
        price: parseFloat(formData.get('price') as string),
        original_price: parseFloat(formData.get('original_price') as string),
        stock_quantity: parseInt(formData.get('stock_quantity') as string),
        requires_prescription: formData.get('requires_prescription') === 'true',
        description: formData.get('description') as string,
        manufacturer: formData.get('manufacturer') as string,
        dosage: formData.get('dosage') as string,
        pack_size: formData.get('pack_size') as string,
        image_url: formData.get('image_url') as string || null,
        is_active: formData.get('is_active') === 'true'
      };

      const { error } = await supabase
        .from('medicines')
        .update(medicineData)
        .eq('id', editingMedicine.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingMedicine(null);
      fetchMedicines();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medicine",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', medicineId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine deleted successfully"
      });

      fetchMedicines();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive"
      });
    }
  };

  const handleRefetchMedicine = async (medicine: Medicine, overwriteManualChanges = false) => {
    if (!medicine.external_source_url) {
      toast({
        title: "Error",
        description: "No source URL available for re-fetching",
        variant: "destructive"
      });
      return;
    }

    setRefetchingMedicines(prev => new Set(prev).add(medicine.id));

    try {
      const { data, error } = await supabase.functions.invoke('refetch-medicine', {
        body: {
          medicineId: medicine.id,
          options: {
            overwriteManualChanges,
            storeHtmlAudit: true
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });

        if (data.updatedFields && data.updatedFields.length > 0) {
          toast({
            title: "Fields Updated",
            description: `Updated: ${data.updatedFields.join(', ')}`,
          });
        }

        if (data.auditUrl) {
          console.log('HTML audit stored at:', data.auditUrl);
        }

        fetchMedicines();
      } else {
        throw new Error(data.message || 'Failed to re-fetch medicine');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to re-fetch medicine data",
        variant: "destructive"
      });
    } finally {
      setRefetchingMedicines(prev => {
        const newSet = new Set(prev);
        newSet.delete(medicine.id);
        return newSet;
      });
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.composition_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUrlImportOpen(true)}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Add via URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsBulkImportOpen(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medicine
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Medicine</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleAddMedicine(formData);
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="brand_trade_name">Brand / Trade Name</Label>
                        <Input 
                          id="brand_trade_name" 
                          name="name" 
                          placeholder="Calpol 650" 
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="composition_text">Salt Composition (Generic)</Label>
                        <Textarea 
                          id="composition_text" 
                          name="composition_text" 
                          placeholder="Paracetamol 650 mg"
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use active ingredients and strengths; powers substitute matching.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="original_price">Original Price</Label>
                        <Input id="original_price" name="original_price" type="number" step="0.01" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity</Label>
                        <Input id="stock_quantity" name="stock_quantity" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="requires_prescription">Requires Prescription</Label>
                        <select id="requires_prescription" name="requires_prescription" className="w-full p-2 border rounded">
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input id="manufacturer" name="manufacturer" />
                      </div>
                      <div>
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input id="dosage" name="dosage" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pack_size">Pack Size</Label>
                      <Input id="pack_size" name="pack_size" />
                    </div>
                    <div>
                      <Label htmlFor="image_url">Thumbnail URL</Label>
                      <div className="space-y-2">
                        <Input id="image_url" name="image_url" type="url" placeholder="Paste image URL here..." />
                        <ThumbnailUrlProcessor 
                          onProcessed={(url) => {
                            const input = document.getElementById('image_url') as HTMLInputElement;
                            if (input) input.value = url;
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={3} />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Add Medicine</Button>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medicines by brand/trade name or salt composition..."
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
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Brand / Trade Name</th>
                          <th className="pb-3 text-sm font-medium text-muted-foreground">Salt Composition</th>
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
                            <td className="py-4 text-muted-foreground">{medicine.composition_text || 'N/A'}</td>
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
                                {medicine.external_source_url && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleRefetchMedicine(medicine)}
                                    disabled={refetchingMedicines.has(medicine.id)}
                                    title="Re-fetch from source URL"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${refetchingMedicines.has(medicine.id) ? 'animate-spin' : ''}`} />
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingMedicine(medicine);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteMedicine(medicine.id)}
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

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          {editingMedicine && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditMedicine(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_brand_trade_name">Brand / Trade Name</Label>
                  <Input 
                    id="edit_brand_trade_name" 
                    name="name" 
                    placeholder="Calpol 650"
                    defaultValue={editingMedicine.name} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="edit_composition_text">Salt Composition (Generic)</Label>
                  <Textarea 
                    id="edit_composition_text" 
                    name="composition_text" 
                    placeholder="Paracetamol 650 mg"
                    rows={2}
                    defaultValue={editingMedicine.composition_text || ''} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use active ingredients and strengths; powers substitute matching.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_price">Price</Label>
                  <Input id="edit_price" name="price" type="number" step="0.01" defaultValue={editingMedicine.price} required />
                </div>
                <div>
                  <Label htmlFor="edit_original_price">Original Price</Label>
                  <Input id="edit_original_price" name="original_price" type="number" step="0.01" defaultValue={editingMedicine.original_price || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_stock_quantity">Stock Quantity</Label>
                  <Input id="edit_stock_quantity" name="stock_quantity" type="number" defaultValue={editingMedicine.stock_quantity} required />
                </div>
                <div>
                  <Label htmlFor="edit_requires_prescription">Requires Prescription</Label>
                  <select id="edit_requires_prescription" name="requires_prescription" className="w-full p-2 border rounded" defaultValue={editingMedicine.requires_prescription.toString()}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_manufacturer">Manufacturer</Label>
                  <Input id="edit_manufacturer" name="manufacturer" defaultValue={editingMedicine.manufacturer || ''} />
                </div>
                <div>
                  <Label htmlFor="edit_dosage">Dosage</Label>
                  <Input id="edit_dosage" name="dosage" defaultValue={editingMedicine.dosage || ''} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_pack_size">Pack Size</Label>
                <Input id="edit_pack_size" name="pack_size" defaultValue={editingMedicine.pack_size || ''} />
              </div>
                <div>
                  <Label htmlFor="edit_image_url">Thumbnail URL</Label>
                  <div className="space-y-2">
                    <Input id="edit_image_url" name="image_url" type="url" defaultValue={editingMedicine.image_url || ''} />
                    <ThumbnailUrlProcessor 
                      onProcessed={(url) => {
                        const input = document.getElementById('edit_image_url') as HTMLInputElement;
                        if (input) input.value = url;
                      }}
                    />
                  </div>
                </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea id="edit_description" name="description" rows={3} defaultValue={editingMedicine.description || ''} />
              </div>
              <div>
                <Label htmlFor="edit_is_active">Status</Label>
                <select id="edit_is_active" name="is_active" className="w-full p-2 border rounded" defaultValue={editingMedicine.is_active.toString()}>
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

      {/* URL Import Dialog */}
      <URLImportDialog
        open={isUrlImportOpen}
        onOpenChange={setIsUrlImportOpen}
        onSuccess={fetchMedicines}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onSuccess={fetchMedicines}
      />
    </SidebarProvider>
  );
};

export default AdminMedicinesPage;