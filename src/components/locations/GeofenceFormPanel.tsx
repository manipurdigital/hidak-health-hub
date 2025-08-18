import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Trash2, 
  Power, 
  Palette, 
  Clock, 
  DollarSign,
  Plus,
  Minus
} from 'lucide-react';

interface WorkingHours {
  [key: string]: { start: string; end: string; enabled: boolean }[];
}

interface EnhancedGeofence {
  id: string;
  name: string;
  color?: string;
  service_type: 'delivery' | 'lab_collection';
  shape_type?: 'polygon' | 'circle';
  polygon_coordinates?: any;
  area_km2?: number | null;
  radius_meters?: number | null;
  is_active: boolean;
  priority?: number;
  capacity_per_day?: number | null;
  min_order_value?: number | null;
  working_hours?: any;
  notes?: string | null;
  center_id?: string | null;
  store_id?: string | null;
}

interface GeofenceFormPanelProps {
  selectedGeofence: EnhancedGeofence | null;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onDeactivate: (id: string) => void;
}

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const colorOptions = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0',
  '#FF9800', '#795548', '#607D8B', '#E91E63', '#00BCD4'
];

export function GeofenceFormPanel({ 
  selectedGeofence, 
  onUpdate, 
  onDelete, 
  onDeactivate 
}: GeofenceFormPanelProps) {
  const [formData, setFormData] = useState<Partial<EnhancedGeofence>>({});
  
  React.useEffect(() => {
    if (selectedGeofence) {
      setFormData({
        name: selectedGeofence.name,
        color: selectedGeofence.color,
        is_active: selectedGeofence.is_active,
        priority: selectedGeofence.priority,
        capacity_per_day: selectedGeofence.capacity_per_day,
        min_order_value: selectedGeofence.min_order_value,
        working_hours: selectedGeofence.working_hours || {},
        notes: selectedGeofence.notes,
      });
    } else {
      setFormData({});
    }
  }, [selectedGeofence]);

  const handleSave = () => {
    if (!selectedGeofence) return;
    onUpdate(selectedGeofence.id, formData);
  };

  const handleDelete = () => {
    if (!selectedGeofence) return;
    if (confirm(`Are you sure you want to delete "${selectedGeofence.name}"?`)) {
      onDelete(selectedGeofence.id);
    }
  };

  const handleDeactivate = () => {
    if (!selectedGeofence) return;
    onDeactivate(selectedGeofence.id);
  };

  const updateWorkingHours = (day: string, index: number, field: string, value: any) => {
    const currentHours = formData.working_hours || {};
    const dayHours = currentHours[day] || [{ start: '09:00', end: '18:00', enabled: true }];
    
    const newDayHours = [...dayHours];
    newDayHours[index] = { ...newDayHours[index], [field]: value };
    
    setFormData({
      ...formData,
      working_hours: {
        ...currentHours,
        [day]: newDayHours
      }
    });
  };

  const addTimeSlot = (day: string) => {
    const currentHours = formData.working_hours || {};
    const dayHours = currentHours[day] || [];
    
    setFormData({
      ...formData,
      working_hours: {
        ...currentHours,
        [day]: [...dayHours, { start: '09:00', end: '18:00', enabled: true }]
      }
    });
  };

  const removeTimeSlot = (day: string, index: number) => {
    const currentHours = formData.working_hours || {};
    const dayHours = currentHours[day] || [];
    
    if (dayHours.length > 1) {
      const newDayHours = dayHours.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        working_hours: {
          ...currentHours,
          [day]: newDayHours
        }
      });
    }
  };

  if (!selectedGeofence) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="text-lg font-medium mb-2">No geofence selected</div>
            <p className="text-sm">Select a geofence from the list or draw a new one on the map</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Geofence</span>
          <div className="flex items-center gap-2">
            <Badge variant={selectedGeofence.is_active ? "default" : "secondary"}>
              {selectedGeofence.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">
              {selectedGeofence.shape_type === 'polygon' ? 'Polygon' : 'Circle'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Geofence name"
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2 mt-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-900' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.is_active || false}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={formData.priority || 1}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <Separator />

        {/* Capacity & Order Value */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="capacity" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Capacity per day
            </Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity_per_day || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                capacity_per_day: e.target.value ? parseInt(e.target.value) : null 
              })}
              placeholder="Max orders/collections per day"
            />
          </div>

          <div>
            <Label htmlFor="minOrder" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Minimum order value
            </Label>
            <Input
              id="minOrder"
              type="number"
              min="0"
              step="0.01"
              value={formData.min_order_value || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                min_order_value: e.target.value ? parseFloat(e.target.value) : null 
              })}
              placeholder="Minimum order amount (optional)"
            />
          </div>
        </div>

        <Separator />

        {/* Working Hours */}
        <div className="space-y-4">
          <Label>Working Hours</Label>
          {daysOfWeek.map((day) => {
            const dayHours = formData.working_hours?.[day] || [{ start: '09:00', end: '18:00', enabled: true }];
            
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTimeSlot(day)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {dayHours.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2 pl-4">
                    <Switch
                      checked={slot.enabled}
                      onCheckedChange={(checked) => updateWorkingHours(day, index, 'enabled', checked)}
                    />
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => updateWorkingHours(day, index, 'start', e.target.value)}
                      disabled={!slot.enabled}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateWorkingHours(day, index, 'end', e.target.value)}
                      disabled={!slot.enabled}
                      className="w-24"
                    />
                    {dayHours.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTimeSlot(day, index)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Geofence Info */}
        <div className="space-y-2">
          <Label>Area Information</Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Area:</span>
              <div className="font-medium">
                {selectedGeofence.area_km2 ? `${selectedGeofence.area_km2} km²` : 'N/A'}
              </div>
            </div>
            {selectedGeofence.shape_type === 'circle' && (
              <div>
                <span className="text-muted-foreground">Radius:</span>
                <div className="font-medium">
                  {selectedGeofence.radius_meters ? `${(selectedGeofence.radius_meters / 1000).toFixed(1)} km` : 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes or instructions..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeactivate}
            className="flex items-center gap-2"
          >
            <Power className="h-4 w-4" />
            {selectedGeofence.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}