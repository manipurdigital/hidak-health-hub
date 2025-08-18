import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGeofences, useUpdateGeofence, useDeleteGeofence } from '@/hooks/geofencing-hooks';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, MapPin, Building, Store } from 'lucide-react';
import { format } from 'date-fns';

interface GeofenceListProps {
  onEdit?: (geofence: any) => void;
}

export function GeofenceList({ onEdit }: GeofenceListProps) {
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const { data: geofences = [], isLoading } = useGeofences(serviceTypeFilter === 'all' ? undefined : serviceTypeFilter);
  const updateGeofence = useUpdateGeofence();
  const deleteGeofence = useDeleteGeofence();

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await updateGeofence.mutateAsync({
      id,
      data: { is_active: !currentActive }
    });
  };

  const handleDelete = async (id: string) => {
    await deleteGeofence.mutateAsync(id);
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

  const getCenterName = (geofence: any) => {
    if (geofence.service_type === 'delivery') {
      return geofence.store_name || 'Unknown Store';
    }
    return geofence.center_name || 'Unknown Center';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading geofences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Existing Geofences
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="lab_collection">Lab Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {geofences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No geofences found. Create your first geofence using the drawing tool above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Center/Store</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geofences.map((geofence) => (
                  <TableRow key={geofence.id}>
                    <TableCell className="font-medium">{geofence.name}</TableCell>
                    <TableCell>
                      {getServiceTypeBadge(geofence.service_type)}
                    </TableCell>
                    <TableCell>{getCenterName(geofence)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{geofence.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={geofence.is_active}
                          onCheckedChange={() => handleToggleActive(geofence.id, geofence.is_active)}
                          disabled={updateGeofence.isPending}
                        />
                        <span className="text-sm text-muted-foreground">
                          {geofence.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(geofence.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit?.(geofence)}
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
                              <AlertDialogTitle>Delete Geofence</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{geofence.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(geofence.id)}
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
  );
}