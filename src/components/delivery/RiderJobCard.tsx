import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRiderStart, useRiderComplete, type DeliveryAssignment } from '@/hooks/delivery-assignment-hooks';
import { Clock, Truck, CheckCircle, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';

interface RiderJobCardProps {
  assignment: DeliveryAssignment;
}

export function RiderJobCard({ assignment }: RiderJobCardProps) {
  const riderStartMutation = useRiderStart();
  const riderCompleteMutation = useRiderComplete();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Pending' };
      case 'on_the_way':
        return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', label: 'On the Way' };
      case 'delivered':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Delivered' };
      default:
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50', label: status };
    }
  };

  const statusConfig = getStatusConfig(assignment.status);
  const StatusIcon = statusConfig.icon;

  const handleStart = () => {
    riderStartMutation.mutate(assignment.order_id);
  };

  const handleComplete = () => {
    riderCompleteMutation.mutate(assignment.order_id);
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      const parts = [];
      if (address.address_line_1) parts.push(address.address_line_1);
      if (address.city) parts.push(address.city);
      if (address.postal_code) parts.push(address.postal_code);
      return parts.join(', ');
    }
    return 'Address not available';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order {assignment.order_number}
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`${statusConfig.bg} ${statusConfig.color} border-current`}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Address */}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Delivery Address</p>
            <p className="text-sm text-muted-foreground">
              {formatAddress(assignment.customer_address)}
            </p>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Assigned</p>
            <p className="text-muted-foreground">
              {assignment.assigned_at 
                ? format(new Date(assignment.assigned_at), 'MMM dd, HH:mm')
                : 'Not assigned'
              }
            </p>
          </div>
          {assignment.picked_up_at && (
            <div>
              <p className="font-medium">Picked Up</p>
              <p className="text-muted-foreground">
                {format(new Date(assignment.picked_up_at), 'MMM dd, HH:mm')}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {assignment.status === 'pending' && (
            <Button 
              onClick={handleStart}
              disabled={riderStartMutation.isPending}
              className="flex-1"
            >
              <Truck className="h-4 w-4 mr-2" />
              {riderStartMutation.isPending ? 'Starting...' : 'Start Trip'}
            </Button>
          )}
          
          {assignment.status === 'on_the_way' && (
            <Button 
              onClick={handleComplete}
              disabled={riderCompleteMutation.isPending}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {riderCompleteMutation.isPending ? 'Completing...' : 'Mark Delivered'}
            </Button>
          )}

          {assignment.status === 'delivered' && (
            <div className="flex-1 text-center py-2 text-green-600 font-medium">
              ✓ Delivery Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}