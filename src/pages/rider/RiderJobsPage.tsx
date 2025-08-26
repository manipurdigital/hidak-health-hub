import { useMyRiderJobs } from '@/hooks/delivery-assignment-hooks';
import { useRealTimeDeliveryUpdates } from '@/hooks/realtime-delivery-hooks';
import { RiderJobCard } from '@/components/delivery/RiderJobCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RiderJobsPage() {
  const { data: assignments = [], isLoading, error } = useMyRiderJobs();
  
  // Enable real-time updates
  useRealTimeDeliveryUpdates();

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              Failed to load your delivery jobs. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">My Deliveries</h1>
          <p className="text-muted-foreground">
            Manage your assigned delivery jobs
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Active Delivery Jobs
          </CardTitle>
          <CardDescription>
            Start trips and mark deliveries as completed. Keep track of your assigned orders and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Deliveries</h3>
              <p className="text-muted-foreground">
                You don't have any delivery jobs assigned right now. Check back later for new assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <RiderJobCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}