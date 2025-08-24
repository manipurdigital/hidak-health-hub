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
import { useToast } from '@/hooks/use-toast';
import { Store, MapPin } from 'lucide-react';

interface StoreForm {
  code: string;
  name: string;
  is_active: boolean;
  address?: string;
}

export default function AdminStoresPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<StoreForm>({ 
    code: '', 
    name: '', 
    is_active: true 
  });
  
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

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: any) => {
      const { error } = await supabase
        .from('stores')
        .insert(storeData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Store created successfully"
      });
      setForm({ code: '', name: '', is_active: true });
      setSelectedLocation(null);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.code.trim() || !form.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Code and name are required",
        variant: "destructive"
      });
      return;
    }

    const storeData = {
      ...form,
      address: selectedLocation?.address || form.address
    };

    createStoreMutation.mutate(storeData);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setSelectedLocation(location);
    if (location.address) {
      setForm(prev => ({ ...prev, address: location.address }));
    }
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
            <CardTitle>Create New Store</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Store Code *</Label>
                <Input
                  id="code"
                  placeholder="Enter unique store code"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  required
                />
              </div>

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
                <Label>Location (Optional)</Label>
                <QuickLocationInput
                  onLocationSelect={handleLocationSelect}
                  title="Store Location"
                  description="Select location for this store"
                />
                {selectedLocation && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      Lat: {selectedLocation.latitude.toFixed(6)}, 
                      Lng: {selectedLocation.longitude.toFixed(6)}
                    </span>
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

              <Button 
                type="submit" 
                className="w-full"
                disabled={createStoreMutation.isPending}
              >
                {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
              </Button>
            </form>
          </CardContent>
        </Card>

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
                      <div>
                        <h4 className="font-medium">{store.name}</h4>
                        <p className="text-sm text-muted-foreground">Code: {store.code}</p>
                        {store.address && (
                          <p className="text-xs text-muted-foreground">{store.address}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        store.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {store.is_active ? 'Active' : 'Inactive'}
                      </span>
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