import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Autocomplete } from '@react-google-maps/api';
import { 
  Search,
  MapPin,
  Building,
  Store,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

interface EnhancedGeofence {
  id: string;
  name: string;
  color?: string;
  service_type: 'delivery' | 'lab_collection';
  shape_type?: 'polygon' | 'circle';
  area_km2?: number | null;
  radius_meters?: number | null;
  is_active: boolean;
  priority?: number;
  center_id?: string | null;
  store_id?: string | null;
  center_name?: string;
  store_name?: string;
}

interface CenterSelectorPanelProps {
  serviceType: 'delivery' | 'lab_collection';
  onServiceTypeChange: (type: 'delivery' | 'lab_collection') => void;
  selectedCenter: string;
  onCenterChange: (centerId: string) => void;
  centers: Array<{ id: string; name: string }>;
  stores: Array<{ id: string; name: string }>;
  geofences: EnhancedGeofence[];
  selectedGeofence: EnhancedGeofence | null;
  onGeofenceSelect: (geofence: EnhancedGeofence | null) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function CenterSelectorPanel({
  serviceType,
  onServiceTypeChange,
  selectedCenter,
  onCenterChange,
  centers,
  stores,
  geofences,
  selectedGeofence,
  onGeofenceSelect,
  onPlaceSelect
}: CenterSelectorPanelProps) {
  const [searchValue, setSearchValue] = React.useState('');
  const [autocomplete, setAutocomplete] = React.useState<google.maps.places.Autocomplete | null>(null);
  
  const availableCenters = serviceType === 'delivery' ? stores : centers;
  
  const filteredGeofences = geofences.filter(g => 
    g.service_type === serviceType &&
    (selectedCenter === 'all' || 
     g.center_id === selectedCenter || 
     g.store_id === selectedCenter) &&
    g.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const onAutocompleteLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place) {
        onPlaceSelect(place);
      }
    }
  };

  const getShapeIcon = (shapeType: string) => {
    return shapeType === 'circle' ? '○' : '▢';
  };

  const getCenterName = (geofence: EnhancedGeofence) => {
    if (serviceType === 'delivery') {
      return geofence.store_name || 'Unknown Store';
    }
    return geofence.center_name || 'Unknown Center';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Locations
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Service Type Selector */}
        <div>
          <Label htmlFor="serviceType">Service Type</Label>
          <Select value={serviceType} onValueChange={onServiceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="delivery">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Medicine Delivery
                </div>
              </SelectItem>
              <SelectItem value="lab_collection">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Lab Collection
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Center Selector */}
        <div>
          <Label htmlFor="center">
            {serviceType === 'delivery' ? 'Store/Pharmacy' : 'Diagnostic Center'}
          </Label>
          <Select value={selectedCenter} onValueChange={onCenterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select center" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="all">All Centers</SelectItem>
              {availableCenters.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Places Search */}
        <div>
          <Label htmlFor="search">Search Location</Label>
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              componentRestrictions: { country: 'in' },
              fields: ['geometry', 'formatted_address', 'name'],
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a location..."
                className="pl-9"
              />
            </div>
          </Autocomplete>
        </div>

        {/* Geofence List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <Label>Geofences ({filteredGeofences.length})</Label>
            <Input
              placeholder="Filter geofences..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-32 h-8"
            />
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredGeofences.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No geofences found for this center
                </div>
              ) : (
                filteredGeofences.map((geofence) => (
                  <div
                    key={geofence.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedGeofence?.id === geofence.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                    onClick={() => onGeofenceSelect(
                      selectedGeofence?.id === geofence.id ? null : geofence
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span 
                            className="text-lg"
                            style={{ color: geofence.color || '#4285F4' }}
                          >
                            {getShapeIcon(geofence.shape_type || 'polygon')}
                          </span>
                          <span className="font-medium text-sm truncate">
                            {geofence.name}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          {getCenterName(geofence)}
                        </div>
                        
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge 
                            variant={geofence.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {geofence.is_active ? (
                              <Eye className="h-3 w-3 mr-1" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1" />
                            )}
                            {geofence.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          
                          <Badge variant="outline" className="text-xs">
                            P{geofence.priority || 1}
                          </Badge>
                          
                          {geofence.area_km2 && (
                            <Badge variant="outline" className="text-xs">
                              {geofence.area_km2} km²
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: geofence.color || '#4285F4' }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}