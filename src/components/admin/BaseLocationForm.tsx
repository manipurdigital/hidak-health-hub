
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateBaseLocation, useUpdateBaseLocation, type BaseLocation } from '@/hooks/base-location-hooks';
import { MapPin, Save, X, Map } from 'lucide-react';
import { MapLocationPicker } from '@/components/MapLocationPicker';

interface BaseLocationFormProps {
  baseLocation?: BaseLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BaseLocationForm({ baseLocation, open, onOpenChange }: BaseLocationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    service_type: 'delivery',
    base_lat: 0,
    base_lng: 0,
    base_fare: 0,
    base_km: 0,
    per_km_fee: 0,
    priority: 1,
    is_active: true,
    is_default: false,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);

  const createBaseLocation = useCreateBaseLocation();
  const updateBaseLocation = useUpdateBaseLocation();

  const isEditing = !!baseLocation;

  useEffect(() => {
    if (baseLocation) {
      setFormData({
        name: baseLocation.name || '',
        service_type: baseLocation.service_type || 'delivery',
        base_lat: baseLocation.base_lat || 0,
        base_lng: baseLocation.base_lng || 0,
        base_fare: baseLocation.base_fare || 0,
        base_km: baseLocation.base_km || 0,
        per_km_fee: baseLocation.per_km_fee || 0,
        priority: baseLocation.priority || 1,
        is_active: baseLocation.is_active ?? true,
        is_default: baseLocation.is_default ?? false,
      });
    } else {
      setFormData({
        name: '',
        service_type: 'delivery',
        base_lat: 0,
        base_lng: 0,
        base_fare: 0,
        base_km: 0,
        per_km_fee: 0,
        priority: 1,
        is_active: true,
        is_default: false,
      });
    }
  }, [baseLocation, open]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    if (!formData.base_lat || !formData.base_lng) return;

    try {
      if (isEditing && baseLocation) {
        await updateBaseLocation.mutateAsync({
          id: baseLocation.id,
          data: formData
        });
      } else {
        await createBaseLocation.mutateAsync(formData);
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
      <DialogContent className="w-[80vw] max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="base-location-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? 'Edit Base Location' : 'Create Base Location'}
          </DialogTitle>
          <div id="base-location-description" className="sr-only">
            {isEditing ? 'Edit the details of an existing base location' : 'Create a new base location for delivery services'}
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column */}
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocationClick}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Current Location
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMapPicker(true)}
              >
                <Map className="h-4 w-4 mr-2" />
                Choose from Map
              </Button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Configuration</h3>
              <div className="grid grid-cols-1 gap-4">
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

            {/* Set as Default */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Set as Default</Label>
                <p className="text-xs text-muted-foreground">
                  Make this the default base location for {formData.service_type}
                </p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
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
        </div>

        <DialogFooter className="flex flex-row gap-2 justify-end pt-4 border-t">
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

      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={(location) => {
          setFormData(prev => ({
            ...prev,
            base_lat: location.latitude,
            base_lng: location.longitude,
          }));
          setShowMapPicker(false);
        }}
        initialLocation={formData.base_lat && formData.base_lng ? { lat: formData.base_lat, lng: formData.base_lng } : undefined}
        title="Select Base Location"
      />
    </Dialog>
  );
}
