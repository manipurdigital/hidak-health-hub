import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Edit, Trash2, MapPinned, MapPin } from 'lucide-react';
import GeofenceSelector from '@/components/admin/GeofenceSelector';
import { QuickLocationInput } from '@/components/QuickLocationInput';
import { LatLngDisplay } from '@/components/LatLngDisplay';

interface LabForm {
  id?: string;
  name: string;
  is_active: boolean;
  address?: string;
}

export default function Labs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<LabForm>({ 
    name: '', 
    address: '',
    is_active: true 
  });
  
  const [editingLab, setEditingLab] = useState<string | null>(null);
  const [selectedGeofences, setSelectedGeofences] = useState<string[]>([]);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  // Fetch diagnostic centers
  const { data: labs, isLoading } = useQuery({
    queryKey: ['diagnostic_centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  // Create/Update lab mutation
  const saveLabMutation = useMutation({
    mutationFn: async (labData: any) => {
      let labId = editingLab;
      
      if (editingLab) {
        const { error } = await supabase
          .from('diagnostic_centers')
          .update(labData)
          .eq('id', editingLab);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('diagnostic_centers')
          .insert(labData)
          .select('id')
          .single();
        if (error) throw error;
        labId = data.id;
      }
      
      // Save geofences if any are selected
      if (selectedGeofences.length > 0 && labId) {
        const { error: geofenceError } = await supabase.rpc('admin_set_lab_geofences' as any, {
          p_center_id: labId,
          p_geofence_ids: selectedGeofences
        });
        if (geofenceError) throw geofenceError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingLab ? "Diagnostic center updated successfully" : "Diagnostic center created successfully"
      });
      setForm({ name: '', address: '', is_active: true });
      setSelectedLocation(null);
      setSelectedGeofences([]);
      setEditingLab(null);
      queryClient.invalidateQueries({ queryKey: ['diagnostic_centers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingLab ? 'update' : 'create'} diagnostic center`,
        variant: "destructive"
      });
    }
  });

  // Save geofences mutation
  const saveGeofencesMutation = useMutation({
    mutationFn: async ({ centerId, geofenceIds }: { centerId: string; geofenceIds: string[] }) => {
      const { error } = await supabase.rpc('admin_set_lab_geofences' as any, {
        p_center_id: centerId,
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

  // Delete lab mutation
  const deleteLabMutation = useMutation({
    mutationFn: async (labId: string) => {
      const { error } = await supabase
        .from('diagnostic_centers')
        .delete()
        .eq('id', labId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diagnostic center deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['diagnostic_centers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete diagnostic center",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Center name is required",
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

    // Auto-generate center code if creating new center
    const centerCode = editingLab ? undefined : `LC${Date.now().toString().slice(-6)}`;
    
    const labData = {
      ...form,
      code: centerCode,
      address: selectedLocation.address || form.address,
      lat: selectedLocation.latitude,
      lng: selectedLocation.longitude
    };

    saveLabMutation.mutate(labData);
  };

  const handleEdit = async (lab: any) => {
    setForm({
      id: lab.id,
      name: lab.name,
      is_active: lab.is_active,
      address: lab.address
    });
    setEditingLab(lab.id);
    // Reset location when editing
    setSelectedLocation(null);
    
    // Fetch current geofence assignments
    const { data } = await supabase
      .from('geofence_lab_links' as any)
      .select('geofence_id')
      .eq('center_id', lab.id);
    
    if (data) {
      setSelectedGeofences(data.map((link: any) => link.geofence_id));
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: '', address: '', is_active: true });
    setSelectedLocation(null);
    setSelectedGeofences([]);
    setEditingLab(null);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    setSelectedLocation(location);
    if (location.address) {
      setForm(prev => ({ ...prev, address: location.address }));
    }
  };

  const handleDelete = (labId: string) => {
    deleteLabMutation.mutate(labId);
  };

  const handleSaveGeofences = () => {
    if (!editingLab) return;
    saveGeofencesMutation.mutate({
      centerId: editingLab,
      geofenceIds: selectedGeofences
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Diagnostic Centers Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Lab Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingLab ? 'Edit Diagnostic Center' : 'Create New Diagnostic Center'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingLab && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Center Code</Label>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    Will be auto-generated: LC{Date.now().toString().slice(-6)}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Center Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter center name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>


              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Center Location *
                </Label>
                <QuickLocationInput
                  onLocationSelect={handleLocationSelect}
                  title="Center Location"
                  description="Select exact location for this center using map"
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

              <div className="space-y-2">
                <Label htmlFor="address">Address Details (Optional)</Label>
                <Input
                  id="address"
                  placeholder="Additional address details"
                  value={form.address || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                />
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
                  Service Areas (Lab Collection)
                </Label>
                <GeofenceSelector
                  serviceType="lab_collection"
                  value={selectedGeofences}
                  onChange={setSelectedGeofences}
                  disabled={saveLabMutation.isPending}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={saveLabMutation.isPending}
                >
                  {saveLabMutation.isPending ? 'Saving...' : (editingLab ? 'Update Center' : 'Create Diagnostic Center')}
                </Button>
                {editingLab && (
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
        {editingLab && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                Service Areas (Lab Collection)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <GeofenceSelector
                serviceType="lab_collection"
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

        {/* Recent Labs List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Diagnostic Centers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading centers...</div>
            ) : labs && labs.length > 0 ? (
              <div className="space-y-3">
                {labs.map((lab, index) => (
                  <div key={lab.id}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{lab.name}</h4>
                        <p className="text-sm text-muted-foreground">ID: {lab.id.slice(0, 8)}...</p>
                        {lab.address && (
                          <p className="text-xs text-muted-foreground">{lab.address}</p>
                        )}
                        {(lab.lat && lab.lng) && (
                          <LatLngDisplay 
                            latitude={lab.lat} 
                            longitude={lab.lng} 
                            variant="compact"
                            showCopyButton={true}
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          lab.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lab.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(lab)}
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
                              <AlertDialogTitle>Delete Diagnostic Center</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lab.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(lab.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {index < labs.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No diagnostic centers found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}