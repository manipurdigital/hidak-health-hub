import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Clock, MapPin, User, Package } from 'lucide-react';
import { format } from 'date-fns';

export interface DeliveryJob {
  id: string;
  order_id: string;
  rider_id: string | null;
  pickup_address: any;
  delivery_address: any;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  estimated_delivery_time: string | null;
  delivery_fee: number;
  distance_km: number | null;
  created_at: string;
  rider?: {
    id: string;
    full_name: string;
    phone: string | null;
    vehicle_type: string;
  };
  order?: {
    id: string;
    total_amount: number;
    user_id: string;
  };
}

interface DeliveryJobCardProps {
  job: DeliveryJob;
  onAssignRider?: (jobId: string) => void;
  onUpdateStatus?: (jobId: string, status: string) => void;
  showActions?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'assigned': return 'default';
    case 'picked_up': return 'default';
    case 'in_transit': return 'default';
    case 'delivered': return 'default';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const getStatusActions = (status: string) => {
  switch (status) {
    case 'pending':
      return ['assigned'];
    case 'assigned':
      return ['picked_up', 'cancelled'];
    case 'picked_up':
      return ['in_transit'];
    case 'in_transit':
      return ['delivered'];
    default:
      return [];
  }
};

export const DeliveryJobCard = ({ job, onAssignRider, onUpdateStatus, showActions = true }: DeliveryJobCardProps) => {
  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      return `${address.address_line_1 || ''} ${address.city || ''} ${address.postal_code || ''}`.trim();
    }
    return 'Address not available';
  };

  const possibleActions = getStatusActions(job.status);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{job.order_id.slice(-8)}
          </CardTitle>
          <Badge variant={getStatusColor(job.status)}>
            {job.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rider Information */}
        {job.rider && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <User className="h-4 w-4" />
            <div>
              <p className="font-medium">{job.rider.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {job.rider.vehicle_type} • {job.rider.phone}
              </p>
            </div>
          </div>
        )}

        {/* Addresses */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">
                {formatAddress(job.pickup_address)}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
            <div>
              <p className="text-sm font-medium">Delivery</p>
              <p className="text-sm text-muted-foreground">
                {formatAddress(job.delivery_address)}
              </p>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Delivery Fee</p>
            <p className="font-medium">₹{job.delivery_fee}</p>
          </div>
          {job.distance_km && (
            <div>
              <p className="text-muted-foreground">Distance</p>
              <p className="font-medium">{job.distance_km} km</p>
            </div>
          )}
          {job.estimated_delivery_time && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Estimated Delivery</p>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(job.estimated_delivery_time), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created: {format(new Date(job.created_at), 'MMM dd, yyyy HH:mm')}</p>
          {job.assigned_at && (
            <p>Assigned: {format(new Date(job.assigned_at), 'MMM dd, yyyy HH:mm')}</p>
          )}
          {job.picked_up_at && (
            <p>Picked up: {format(new Date(job.picked_up_at), 'MMM dd, yyyy HH:mm')}</p>
          )}
          {job.delivered_at && (
            <p>Delivered: {format(new Date(job.delivered_at), 'MMM dd, yyyy HH:mm')}</p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {job.status === 'pending' && onAssignRider && (
              <Button 
                size="sm" 
                onClick={() => onAssignRider(job.id)}
                className="flex items-center gap-1"
              >
                <Truck className="h-4 w-4" />
                Assign Rider
              </Button>
            )}
            
            {possibleActions.map((action) => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus?.(job.id, action)}
              >
                {action.replace('_', ' ').toUpperCase()}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};