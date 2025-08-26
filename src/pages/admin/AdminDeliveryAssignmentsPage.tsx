import { AdminGuard } from '@/components/auth/AdminGuard';
import { DeliveryAssignmentTable } from '@/components/delivery/DeliveryAssignmentTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function AdminDeliveryAssignmentsPage() {
  return (
    <AdminGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Delivery Assignments</h1>
            <p className="text-muted-foreground">
              Manage and track delivery assignments for orders
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Management</CardTitle>
            <CardDescription>
              Assign riders to orders, track delivery status, and manage the delivery workflow.
              Filter by status, order number, or rider to find specific assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryAssignmentTable />
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}