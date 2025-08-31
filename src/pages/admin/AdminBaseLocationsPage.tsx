
// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useBaseLocations, useUpdateBaseLocation, useDeleteBaseLocation, BaseLocation } from '@/hooks/base-location-hooks';
import { BaseLocationForm } from '@/components/admin/BaseLocationForm';
import { FeeTestingPanel } from '@/components/admin/FeeTestingPanel';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Plus, Edit, Trash2, Building, Store } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBaseLocationsPage() {
  const [selectedBaseLocation, setSelectedBaseLocation] = useState<BaseLocation | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: baseLocations = [], isLoading } = useBaseLocations();
  const updateBaseLocation = useUpdateBaseLocation();
  const deleteBaseLocation = useDeleteBaseLocation();

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateBaseLocation.mutateAsync({
      id,
      data: { is_active: !currentActive }
    });
  };

  const handleDelete = async (id: string) => {
    await deleteBaseLocation.mutateAsync(id);
  };

  const handleEdit = (baseLocation: BaseLocation) => {
    setSelectedBaseLocation(baseLocation);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedBaseLocation(null);
    setShowForm(true);
  };

  const getServiceTypeBadge = (serviceType: string) => {
    if (serviceType === 'delivery') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Store className="h-3 w-3 mr-1" />
          Delivery
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Building className="h-3 w-3 mr-1" />
        Lab Collection
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Base Locations</h1>
          <p className="text-muted-foreground">Loading base locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Base Locations</h1>
        <p className="text-muted-foreground">
          Manage delivery base locations for fee calculation
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">About Base Locations</h3>
              <p className="text-blue-700 text-sm mt-1">
                Base locations serve as reference points for calculating delivery fees. 
                The system finds the nearest base location to calculate distance and applies 
                the configured pricing: Base Fare + (Distance × Per KM Fee).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Base Locations List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Base Locations ({baseLocations.length})
                </CardTitle>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {baseLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No base locations configured</p>
                  <p className="text-sm">Create your first base location to start calculating delivery fees</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {baseLocations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell>
                            {getServiceTypeBadge(location.service_type)}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {location.base_lat.toFixed(6)}, {location.base_lng.toFixed(6)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>₹{location.base_fare} + ₹{location.per_km_fee}/km</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{location.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={location.is_active}
                                onCheckedChange={() => handleToggleActive(location.id, location.is_active)}
                                disabled={updateBaseLocation.isPending}
                              />
                              <span className="text-sm text-muted-foreground">
                                {location.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(location)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Base Location</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{location.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(location.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fee Testing Panel */}
        <div>
          <FeeTestingPanel />
        </div>
      </div>

      {/* Form Dialog */}
      <BaseLocationForm
        baseLocation={selectedBaseLocation}
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setSelectedBaseLocation(null);
        }}
      />
    </div>
  );
}
