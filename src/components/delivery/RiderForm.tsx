import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface RiderFormData {
  code: string;
  full_name: string;
  phone: string;
  vehicle_type: 'bike' | 'car' | 'scooter' | 'other';
  is_active: boolean;
}

interface RiderFormProps {
  initialData?: Partial<RiderFormData>;
  onSubmit: (data: RiderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RiderForm = ({ initialData, onSubmit, onCancel, isLoading }: RiderFormProps) => {
  const [formData, setFormData] = useState<RiderFormData>({
    code: initialData?.code || '',
    full_name: initialData?.full_name || '',
    phone: initialData?.phone || '',
    vehicle_type: initialData?.vehicle_type || 'bike',
    is_active: initialData?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof RiderFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Rider' : 'Add New Rider'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Rider Code *</Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="e.g. RID-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_type">Vehicle Type *</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(value) => handleInputChange('vehicle_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active Status</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Rider'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};