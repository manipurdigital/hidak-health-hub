import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpdateGeofence } from '@/hooks/geofencing-hooks';
import { GeofenceAreaEditor } from './GeofenceAreaEditor';
import { normalizeService } from '@/utils/geo';
import { Save, X, Settings, Map } from 'lucide-react';

interface GeofenceEditDialogProps {
  geofence: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeofenceEditDialog({ geofence, open, onOpenChange }: GeofenceEditDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'delivery' as 'delivery' | 'lab_collection',
    priority: 5,
    is_active: true,
    polygon_coordinates: null as any,
  });

  const updateGeofence = useUpdateGeofence();

  useEffect(() => {
    if (geofence) {
      setFormData({
        name: geofence.name || '',
        service_type: geofence.service_type || 'delivery',
        priority: geofence.priority || 5,
        is_active: geofence.is_active ?? true,
        polygon_coordinates: geofence.polygon_coordinates || null,
      });
    }
  }, [geofence]);

  const handleSave = async () => {
    if (!geofence) return;

    try {
      await updateGeofence.mutateAsync({
        id: geofence.id,
        data: formData
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating geofence:', error);
    }
  };

  const handlePolygonChange = (newPolygon: any) => {
    setFormData(prev => ({ ...prev, polygon_coordinates: newPolygon }));
  };

  const handleAreaSave = () => {
    // Area changes are already in formData, just update the UI
    console.log('Area updated');
  };

  const getServiceDisplayName = (serviceType: string) => {
    return serviceType === 'delivery' ? 'Medicine Delivery' : 'Lab Home Collection';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Geofence
            {geofence && <span className="text-muted-foreground">- {geofence.name}</span>}
          </DialogTitle>
        </DialogHeader>
        
        
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="area" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Edit Area
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Geofence Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter geofence name"
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value: 'delivery' | 'lab_collection') => 
                  setFormData(prev => ({ ...prev, service_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Medicine Delivery</SelectItem>
                  <SelectItem value="lab_collection">Lab Home Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority geofences take precedence when areas overlap
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable this geofence
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="area" className="py-4">
            <GeofenceAreaEditor
              currentPolygon={formData.polygon_coordinates}
              onPolygonChange={handlePolygonChange}
              onSave={handleAreaSave}
              onCancel={() => {/* Area editor handles its own cancel */}}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={updateGeofence.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateGeofence.isPending || !formData.name.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateGeofence.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}