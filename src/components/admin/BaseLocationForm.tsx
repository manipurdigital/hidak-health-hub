
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateBaseLocation, useUpdateBaseLocation } from '@/hooks/base-location-placeholders';

interface BaseLocation {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
}
import { useCentersAndStores } from '@/hooks/geofencing-hooks';
import { MapPin, Save, X } from 'lucide-react';

interface BaseLocationFormProps {
  baseLocation?: BaseLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BaseLocationForm({ baseLocation, open, onOpenChange }: BaseLocationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'delivery',
    geofence_id: 'none',
    base_lat: 0,
    base_lng: 0,
    base_fare: 0,
    base_km: 0,
    per_km_fee: 0,
    priority: 1,
    is_active: true,
  });

  const { data: centersAndStores } = useCentersAndStores();
  const createBaseLocation = useCreateBaseLocation();
  const updateBaseLocation = useUpdateBaseLocation();

  const isEditing = !!baseLocation;

  useEffect(() => {
    if (baseLocation) {
      setFormData({
        name: baseLocation.name || '',
        service_type: baseLocation.service_type || 'delivery',
        geofence_id: baseLocation.geofence_id || 'none',
        base_lat: baseLocation.base_lat || 0,
        base_lng: baseLocation.base_lng || 0,
        base_fare: baseLocation.base_fare || 0,
        base_km: (baseLocation as any).base_km || 0,
        per_km_fee: baseLocation.per_km_fee || 0,
        priority: baseLocation.priority || 1,
        is_active: baseLocation.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        service_type: 'delivery',
        geofence_id: 'none',
        base_lat: 0,
        base_lng: 0,
        base_fare: 0,
        base_km: 0,
        per_km_fee: 0,
        priority: 1,
        is_active: true,
      });
    }
  }, [baseLocation, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (!formData.base_lat || !formData.base_lng) return;

    try {
      const submitData = {
        ...formData,
        geofence_id: formData.geofence_id === 'none' ? undefined : formData.geofence_id,
      };

      if (isEditing && baseLocation) {
        await updateBaseLocation.mutateAsync({
          id: baseLocation.id,
          data: submitData
        });
      } else {
        await createBaseLocation.mutateAsync(submitData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving base location:', error);
    }
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            base_lat: position.coords.latitude,
            base_lng: position.coords.longitude,
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? 'Edit Base Location' : 'Create Base Location'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Imphal Central, Thoubal Hub"
            />
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, service_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Medicine Delivery</SelectItem>
                <SelectItem value="lab_collection">Lab Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Geofence (Optional) */}
          <div className="space-y-2">
            <Label>Associated Geofence (Optional)</Label>
            <Select
              value={formData.geofence_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, geofence_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select geofence (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {/* Note: Would need to fetch geofences here */}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.base_lat}
                onChange={(e) => setFormData(prev => ({ ...prev, base_lat: parseFloat(e.target.value) || 0 }))}
                placeholder="24.817"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.base_lng}
                onChange={(e) => setFormData(prev => ({ ...prev, base_lng: parseFloat(e.target.value) || 0 }))}
                placeholder="93.938"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationClick}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_fare">Base Fare (₹)</Label>
              <Input
                id="base_fare"
                type="number"
                step="0.01"
                min="0"
                value={formData.base_fare}
                onChange={(e) => setFormData(prev => ({ ...prev, base_fare: parseFloat(e.target.value) || 0 }))}
                placeholder="20.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_km">Base KM</Label>
              <Input
                id="base_km"
                type="number"
                step="0.1"
                min="0"
                value={formData.base_km}
                onChange={(e) => setFormData(prev => ({ ...prev, base_km: parseFloat(e.target.value) || 0 }))}
                placeholder="5.0"
              />
              <p className="text-xs text-muted-foreground">Distance covered by base fare</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="per_km_fee">Per KM Fee (₹)</Label>
              <Input
                id="per_km_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.per_km_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, per_km_fee: parseFloat(e.target.value) || 0 }))}
                placeholder="5.00"
              />
              <p className="text-xs text-muted-foreground">Fee for each additional KM</p>
            </div>
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
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
            />
            <p className="text-xs text-muted-foreground">
              Higher priority locations are preferred for calculations
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable this base location
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createBaseLocation.isPending || updateBaseLocation.isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={
              createBaseLocation.isPending || 
              updateBaseLocation.isPending || 
              !formData.name.trim() ||
              !formData.base_lat ||
              !formData.base_lng
            }
          >
            <Save className="h-4 w-4 mr-2" />
            {createBaseLocation.isPending || updateBaseLocation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
