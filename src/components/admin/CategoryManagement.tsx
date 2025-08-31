import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Package, TestTube } from 'lucide-react';
import { 
  useMedicineCategories, 
  useCreateMedicineCategory, 
  useUpdateMedicineCategory, 
  useDeleteMedicineCategory
} from '@/hooks/category-hooks';

interface CategoryFormData {
  name: string;
  description: string;
}

interface EditingCategory {
  id: string;
  name: string;
  description: string;
}

const CategoryManagement = () => {
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [editingMedicineCategory, setEditingMedicineCategory] = useState<EditingCategory | null>(null);
  
  const [medicineFormData, setMedicineFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });

  // Medicine category hooks
  const { data: medicineCategories, isLoading: medicineLoading } = useMedicineCategories();
  const createMedicineCategory = useCreateMedicineCategory();
  const updateMedicineCategory = useUpdateMedicineCategory();
  const deleteMedicineCategory = useDeleteMedicineCategory();

  const handleMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMedicineCategory) {
      updateMedicineCategory.mutate({
        id: editingMedicineCategory.id,
        ...medicineFormData
      });
      setEditingMedicineCategory(null);
    } else {
      createMedicineCategory.mutate(medicineFormData);
    }
    
    setMedicineFormData({ name: '', description: '' });
    setMedicineDialogOpen(false);
  };

  const handleEditMedicineCategory = (category: any) => {
    setEditingMedicineCategory(category);
    setMedicineFormData({
      name: category.name,
      description: category.description || ''
    });
    setMedicineDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage categories for medicines
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Medicine Categories */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Medicine Categories
            </h2>
            <Dialog open={medicineDialogOpen} onOpenChange={setMedicineDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingMedicineCategory(null);
                  setMedicineFormData({ name: '', description: '' });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medicine Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMedicineCategory ? 'Edit' : 'Add'} Medicine Category
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMedicineSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="medicine-name">Name</Label>
                    <Input
                      id="medicine-name"
                      value={medicineFormData.name}
                      onChange={(e) => setMedicineFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Pain Relief"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicine-description">Description</Label>
                    <Textarea
                      id="medicine-description"
                      value={medicineFormData.description}
                      onChange={(e) => setMedicineFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the category"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setMedicineDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMedicineCategory.isPending || updateMedicineCategory.isPending}>
                      {editingMedicineCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {medicineLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicineCategories?.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">💊</span>
                        {category.name}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMedicineCategory(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Category</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{category.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMedicineCategory.mutate(category.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {category.description || 'No description provided'}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      Medicine Category
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;