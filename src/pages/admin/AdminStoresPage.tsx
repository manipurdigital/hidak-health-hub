// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Store, MapPin, Edit, Trash2, MapPinned, Eye, Phone, Mail, MapIcon } from 'lucide-react';
import GeofenceSelector from '@/components/admin/GeofenceSelector';
import { LatLngDisplay } from '@/components/LatLngDisplay';

interface StoreForm {
  id?: string;
  name: string;
  is_active: boolean;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
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
  const [viewingStore, setViewingStore] = useState<any>(null);
  
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

  // Toggle store status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ storeId, isActive }: { storeId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: isActive })
        .eq('id', storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store status",
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Optional validation - check if selected geofences cover the pin
    if (selectedGeofences.length > 0) {
      try {
        const { data: coverage } = await supabase.rpc('check_point_serviceability', {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          service_type: 'delivery'
        });
        const coverageIds = new Set((coverage ?? []).map((r: any) => r.geofence_id));
        const outsideChosen = selectedGeofences.filter(id => !coverageIds.has(id));
        if (outsideChosen.length > 0) {
          toast({ 
            title: "Warning", 
            description: `${outsideChosen.length} selected areas don't cover this location`, 
            variant: "default" 
          });
        }
      } catch (error) {
        console.warn("Coverage check failed:", error);
      }
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
      address: store.address,
      phone: store.phone,
      email: store.email,
      city: store.city,
      state: store.state,
      pincode: store.pincode
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

  const handleToggleStatus = (storeId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ storeId, isActive: !currentStatus });
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setSelectedLocation(location);
    if (location.address) {
      setForm(prev => ({ ...prev, address: location.address }));
    }
  };

  // Auto-preselect geofences when location changes
  useEffect(() => {
    if (!selectedLocation) return;
    
    const preSelectGeofences = async () => {
      try {
        const { data: coverage } = await supabase.rpc('check_point_serviceability', {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          service_type: 'delivery'
        });
        const geofenceIds = (coverage ?? []).map((r: any) => r.geofence_id);
        setSelectedGeofences(geofenceIds);
      } catch (error) {
        console.warn("Failed to auto-select geofences:", error);
      }
    };

    preSelectGeofences();
  }, [selectedLocation]);

  const handleSaveGeofences = async () => {
    if (!editingStore) return;

    // Optional validation - check if selected geofences cover the pin
    if (selectedLocation && selectedGeofences.length > 0) {
      try {
        const { data: coverage } = await supabase.rpc('check_point_serviceability', {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
          service_type: 'delivery'
        });
        const coverageIds = new Set((coverage ?? []).map((r: any) => r.geofence_id));
        const outsideChosen = selectedGeofences.filter(id => !coverageIds.has(id));
        if (outsideChosen.length > 0) {
          toast({ 
            title: "Warning", 
            description: `${outsideChosen.length} selected areas don't cover this location`, 
            variant: "default" 
          });
        }
      } catch (error) {
        console.warn("Coverage check failed:", error);
      }
    }

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={form.phone || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={form.email || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={form.city || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    value={form.state || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="Enter pincode"
                    value={form.pincode || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))}
                  />
                </div>
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
                      <div className="flex-1 cursor-pointer" onClick={() => setViewingStore(store)}>
                        <h4 className="font-medium hover:text-primary">{store.name}</h4>
                        <p className="text-sm text-muted-foreground">Code: {store.code}</p>
                        {store.address && (
                          <p className="text-xs text-muted-foreground">{store.address}</p>
                        )}
                        {store.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {store.phone}
                          </p>
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
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={store.is_active}
                            onCheckedChange={() => handleToggleStatus(store.id, store.is_active)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <span className={`text-xs px-2 py-1 rounded ${
                            store.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {store.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingStore(store)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5" />
                                Store Details - {store.name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-sm font-medium">Store Name</Label>
                                  <p className="text-sm">{store.name}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Store Code</Label>
                                  <p className="text-sm font-mono">{store.code}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <span className={`inline-block text-xs px-2 py-1 rounded ${
                                    store.is_active 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {store.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                {store.phone && (
                                  <div>
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      Phone
                                    </Label>
                                    <p className="text-sm">{store.phone}</p>
                                  </div>
                                )}
                                {store.email && (
                                  <div>
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      Email
                                    </Label>
                                    <p className="text-sm">{store.email}</p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                {store.address && (
                                  <div>
                                    <Label className="text-sm font-medium flex items-center gap-1">
                                      <MapIcon className="h-3 w-3" />
                                      Address
                                    </Label>
                                    <p className="text-sm">{store.address}</p>
                                  </div>
                                )}
                                {(store.city || store.state || store.pincode) && (
                                  <div>
                                    <Label className="text-sm font-medium">Location Details</Label>
                                    <div className="text-sm space-y-1">
                                      {store.city && <p>City: {store.city}</p>}
                                      {store.state && <p>State: {store.state}</p>}
                                      {store.pincode && <p>Pincode: {store.pincode}</p>}
                                    </div>
                                  </div>
                                )}
                                {(store.lat && store.lng) && (
                                  <div>
                                    <Label className="text-sm font-medium">Coordinates</Label>
                                    <LatLngDisplay 
                                      latitude={store.lat} 
                                      longitude={store.lng} 
                                      variant="detailed"
                                      showCopyButton={true}
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                                <div>
                                  <Label className="text-sm font-medium">Created</Label>
                                  <p className="text-sm">{new Date(store.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
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