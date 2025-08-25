import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuickLocationInput } from '@/components/QuickLocationInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Store, MapPin, Edit, Trash2, MapPinned } from 'lucide-react';
import GeofenceSelector from '@/components/admin/GeofenceSelector';
import { LatLngDisplay } from '@/components/LatLngDisplay';

interface StoreForm {
  id?: string;
  name: string;
  is_active: boolean;
  address?: string;
}

export default function AdminStoresPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<StoreForm>({ 
    name: '', 
    is_active: true 
  });
  
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [selectedGeofences, setSelectedGeofences] = useState<string[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  // Fetch stores
  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Create/Update store mutation
  const saveStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      let storeId = editingStore;
      
      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('stores')
          .insert(storeData)
          .select('id')
          .single();
        if (error) throw error;
        storeId = data.id;
      }
      
      // Save geofences if any are selected
      if (selectedGeofences.length > 0 && storeId) {
        const { error: geofenceError } = await supabase.rpc('admin_set_store_geofences' as any, {
          p_store_id: storeId,
          p_geofence_ids: selectedGeofences
        });
        if (geofenceError) throw geofenceError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingStore ? "Store updated successfully" : "Store created successfully"
      });
      setForm({ name: '', is_active: true });
      setSelectedLocation(null);
      setSelectedGeofences([]);
      setEditingStore(null);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingStore ? 'update' : 'create'} store`,
        variant: "destructive"
      });
    }
  });

  // Save geofences mutation
  const saveGeofencesMutation = useMutation({
    mutationFn: async ({ storeId, geofenceIds }: { storeId: string; geofenceIds: string[] }) => {
      const { error } = await supabase.rpc('admin_set_store_geofences' as any, {
        p_store_id: storeId,
        p_geofence_ids: geofenceIds
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Service areas updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service areas",
        variant: "destructive"
      });
    }
  });

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete store",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Store name is required",
        variant: "destructive"
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: "Validation Error", 
        description: "Please select a location on the map",
        variant: "destructive"
      });
      return;
    }

    // Auto-generate store code if creating new store
    const storeCode = editingStore ? undefined : `ST${Date.now().toString().slice(-6)}`;
    
    const storeData = {
      ...form,
      code: storeCode,
      address: selectedLocation.address || form.address,
      lat: selectedLocation.latitude,
      lng: selectedLocation.longitude
    };

    saveStoreMutation.mutate(storeData);
  };

  const handleEdit = async (store: any) => {
    setForm({
      id: store.id,
      name: store.name,
      is_active: store.is_active,
      address: store.address
    });
    setEditingStore(store.id);
    // Reset location when editing
    setSelectedLocation(null);
    
    // Fetch current geofence assignments
    const { data } = await supabase
      .from('geofence_store_links' as any)
      .select('geofence_id')
      .eq('store_id', store.id);
    
    if (data) {
      setSelectedGeofences(data.map((link: any) => link.geofence_id));
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: '', is_active: true });
    setSelectedLocation(null);
    setSelectedGeofences([]);
    setEditingStore(null);
  };

  const handleDelete = (storeId: string) => {
    deleteStoreMutation.mutate(storeId);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setSelectedLocation(location);
    if (location.address) {
      setForm(prev => ({ ...prev, address: location.address }));
    }
  };

  const handleSaveGeofences = () => {
    if (!editingStore) return;
    saveGeofencesMutation.mutate({
      storeId: editingStore,
      geofenceIds: selectedGeofences
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Stores Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Store Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingStore ? 'Edit Store' : 'Create New Store'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingStore && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Store Code</Label>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    Will be auto-generated: ST{Date.now().toString().slice(-6)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter store name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter store address (optional)"
                  value={form.address || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Store Location *
                </Label>
                <QuickLocationInput
                  onLocationSelect={handleLocationSelect}
                  title="Store Location"
                  description="Select exact location for this store using map"
                />
                {selectedLocation ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <LatLngDisplay
                      latitude={selectedLocation.latitude}
                      longitude={selectedLocation.longitude}
                      variant="detailed"
                      showCopyButton={true}
                      className="text-green-800"
                    />
                    {selectedLocation.address && (
                      <div className="mt-2 text-sm text-green-700">
                        Address: {selectedLocation.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Please select a location on the map - this is required
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, is_active: !!checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4" />
                  Service Areas (Delivery)
                </Label>
                <GeofenceSelector
                  serviceType="delivery"
                  value={selectedGeofences}
                  onChange={setSelectedGeofences}
                  disabled={saveStoreMutation.isPending}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={saveStoreMutation.isPending}
                >
                  {saveStoreMutation.isPending ? 'Saving...' : (editingStore ? 'Update Store' : 'Create Store')}
                </Button>
                {editingStore && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Service Areas - Only show when editing */}
        {editingStore && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                Service Areas (Delivery)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GeofenceSelector
                serviceType="delivery"
                value={selectedGeofences}
                onChange={setSelectedGeofences}
                disabled={saveGeofencesMutation.isPending}
              />
              <Button 
                onClick={handleSaveGeofences}
                disabled={saveGeofencesMutation.isPending}
                className="w-full"
              >
                {saveGeofencesMutation.isPending ? 'Saving...' : 'Save Service Areas'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Stores List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading stores...</div>
            ) : stores && stores.length > 0 ? (
              <div className="space-y-3">
                {stores.map((store, index) => (
                  <div key={store.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{store.name}</h4>
                        <p className="text-sm text-muted-foreground">Code: {store.code}</p>
                        {store.address && (
                          <p className="text-xs text-muted-foreground">{store.address}</p>
                        )}
                        {(store.lat && store.lng) && (
                          <LatLngDisplay 
                            latitude={store.lat} 
                            longitude={store.lng} 
                            variant="compact"
                            showCopyButton={true}
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          store.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(store)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Store</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{store.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(store.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {index < stores.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No stores found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}