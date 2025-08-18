import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateAddress } from '@/hooks/medicine-hooks';
import { Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';

interface AddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddressDialog({ isOpen, onClose }: AddressDialogProps) {
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    landmark: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_default: false,
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const createAddress = useCreateAddress();
  const { isLoaded } = useGoogleMaps();

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Extract address components
        let city = '', state = '', postal_code = '';
        place.address_components?.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('postal_code')) postal_code = component.long_name;
        });

        setFormData(prev => ({
          ...prev,
          address_line_1: place.formatted_address || '',
          city: city || prev.city,
          state: state || prev.state,
          postal_code: postal_code || prev.postal_code,
          latitude: lat,
          longitude: lng,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAddress.mutateAsync(formData);
      
      // Reset form
      setFormData({
        type: 'home',
        name: '',
        phone: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        landmark: '',
        latitude: null,
        longitude: null,
        is_default: false,
      });
      
      onClose();
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Address Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="address_line_1">Address *</Label>
            {isLoaded ? (
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                options={{
                  componentRestrictions: { country: 'in' },
                  fields: ['formatted_address', 'geometry', 'address_components'],
                }}
              >
                <Input
                  id="address_line_1"
                  value={formData.address_line_1}
                  onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                  placeholder="Search for address or enter manually"
                  required
                />
              </Autocomplete>
            ) : (
              <Input
                id="address_line_1"
                value={formData.address_line_1}
                onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                placeholder="House/Flat/Building Number, Street"
                required
              />
            )}
          </div>

          <div>
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input
              id="address_line_2"
              value={formData.address_line_2}
              onChange={(e) => handleInputChange('address_line_2', e.target.value)}
              placeholder="Area, Colony, Locality"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange('landmark', e.target.value)}
                placeholder="Near landmark"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => handleInputChange('is_default', checked as boolean)}
            />
            <Label htmlFor="is_default">Set as default address</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAddress.isPending}
              className="flex-1"
            >
              {createAddress.isPending ? 'Saving...' : 'Save Address'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}