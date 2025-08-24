import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleMapsProvider } from '@/contexts/GoogleMapsContext';
import { GeofenceDrawingMap } from '@/components/geofencing/GeofenceDrawingMap';
import { GeofenceList } from '@/components/geofencing/GeofenceList';
import { GeofenceAssignments } from '@/components/geofencing/GeofenceAssignments';
import { ServiceabilityChecker } from '@/components/geofencing/ServiceabilityChecker';
import { GeofenceEditDialog } from '@/components/geofencing/GeofenceEditDialog';
import { MapPin, Layers, Link, Search } from 'lucide-react';

export default function AdminGeofencingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingGeofence, setEditingGeofence] = useState<any | null>(null);

  const handleGeofenceCreated = () => {
    // Refresh the geofence list
    setRefreshKey(prev => prev + 1);
  };

  const handleEditGeofence = (geofence: any) => {
    setEditingGeofence(geofence);
  };

  const handleCloseEdit = () => {
    setEditingGeofence(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <GoogleMapsProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Geofencing Management</h1>
          <p className="text-muted-foreground">
            Create and manage service areas for pharmacies and diagnostic centers
          </p>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900">About Geofencing</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Geofences define service areas for your centers. Draw polygons on the map to specify where 
                  medicine delivery and lab collection services are available. Higher priority geofences take 
                  precedence when areas overlap.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Create Geofence
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Manage Geofences
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Test Serviceability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <GeofenceDrawingMap onGeofenceCreated={handleGeofenceCreated} />
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            <GeofenceList key={refreshKey} onEdit={handleEditGeofence} />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <GeofenceAssignments />
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <ServiceabilityChecker />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <GeofenceEditDialog
          geofence={editingGeofence}
          open={!!editingGeofence}
          onOpenChange={(open) => {
            if (!open) handleCloseEdit();
          }}
        />
      </div>
    </GoogleMapsProvider>
  );
}